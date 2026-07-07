from dataclasses import dataclass
from functools import lru_cache
from heapq import heappop, heappush
from math import ceil

from google.cloud import firestore

from models.route import AccessibilityNeed, CongestionLevel, RouteOption, RouteStep
from models.zone import Zone
from schemas.responses import RouteResponse
from services.exceptions import AIServiceError, ResourceNotFoundError
from services.firestore_client import get_firestore_client
from services.genkit_flows import wayfindingFlow


@dataclass(frozen=True)
class GraphEdge:
    destination: str
    base_weight: float
    tags: frozenset[str] = frozenset()


@dataclass(frozen=True)
class PathResult:
    zones: list[str]
    cost: float


ZoneGraph = dict[str, list[GraphEdge]]


@lru_cache
def load_zone_graph() -> ZoneGraph:
    return {
        "gate-2": [
            GraphEdge("north-concourse", 3.0),
            GraphEdge("gate-4", 4.0),
        ],
        "gate-4": [
            GraphEdge("gate-2", 4.0),
            GraphEdge("north-concourse", 2.0),
            GraphEdge("east-concourse", 3.0, frozenset({"stairs_only"})),
            GraphEdge("south-transit-hub", 5.0),
        ],
        "north-concourse": [
            GraphEdge("gate-2", 3.0),
            GraphEdge("gate-4", 2.0),
            GraphEdge("seat-block-114", 3.0),
            GraphEdge("east-concourse", 4.0),
        ],
        "east-concourse": [
            GraphEdge("north-concourse", 4.0),
            GraphEdge("gate-4", 3.0, frozenset({"stairs_only"})),
            GraphEdge("seat-block-114", 2.0),
        ],
        "seat-block-114": [
            GraphEdge("north-concourse", 3.0),
            GraphEdge("east-concourse", 2.0),
        ],
        "south-transit-hub": [
            GraphEdge("gate-4", 5.0),
            GraphEdge("gate-2", 6.0),
        ],
    }


def congestion_multiplier(density_pct: float) -> float:
    return 1.0 + (1.5 * (density_pct / 100))


def remove_edges_tagged(graph: ZoneGraph, tag: str) -> ZoneGraph:
    return {zone_id: [edge for edge in edges if tag not in edge.tags] for zone_id, edges in graph.items()}


def load_zones(db: firestore.Client) -> dict[str, Zone]:
    snapshots = db.collection("zones").limit(50).stream()
    zones: dict[str, Zone] = {}
    for snapshot in snapshots:
        data = snapshot.to_dict()
        if data:
            zones[snapshot.id] = Zone(zoneId=snapshot.id, **data)
    return zones


def edge_weight(edge: GraphEdge, zones: dict[str, Zone]) -> float:
    destination = zones.get(edge.destination)
    density = destination.current_density_pct if destination else 0.0
    return edge.base_weight * congestion_multiplier(density)


def dijkstra_shortest_path(
    graph: ZoneGraph,
    from_zone_id: str,
    to_zone_id: str,
    zones: dict[str, Zone],
) -> PathResult:
    queue: list[tuple[float, str, list[str]]] = [(0.0, from_zone_id, [from_zone_id])]
    best_costs: dict[str, float] = {from_zone_id: 0.0}

    while queue:
        cost, current, path = heappop(queue)
        if current == to_zone_id:
            return PathResult(zones=path, cost=cost)
        if cost > best_costs.get(current, float("inf")):
            continue
        for edge in graph.get(current, []):
            next_cost = cost + edge_weight(edge, zones)
            if next_cost < best_costs.get(edge.destination, float("inf")):
                best_costs[edge.destination] = next_cost
                heappush(queue, (next_cost, edge.destination, [*path, edge.destination]))

    raise ResourceNotFoundError(f"No route found from {from_zone_id} to {to_zone_id}.")


def find_comparable_alternatives(
    graph: ZoneGraph,
    baseline: PathResult,
    from_zone_id: str,
    to_zone_id: str,
    zones: dict[str, Zone],
) -> list[PathResult]:
    candidates: list[PathResult] = []
    baseline_edges = set(zip(baseline.zones, baseline.zones[1:], strict=False))
    for start, end in baseline_edges:
        pruned = {
            zone_id: [edge for edge in edges if not (zone_id == start and edge.destination == end)]
            for zone_id, edges in graph.items()
        }
        try:
            candidate = dijkstra_shortest_path(pruned, from_zone_id, to_zone_id, zones)
        except ResourceNotFoundError:
            continue
        if candidate.zones != baseline.zones and candidate.cost <= baseline.cost * 1.2:
            candidates.append(candidate)
    candidates.sort(key=lambda item: item.cost)
    return candidates[:1]


def congestion_level_for_path(path: list[str], zones: dict[str, Zone]) -> CongestionLevel:
    max_density = max((zones[zone_id].current_density_pct for zone_id in path if zone_id in zones), default=0.0)
    if max_density < 50:
        return CongestionLevel.low
    if max_density < 75:
        return CongestionLevel.medium
    if max_density < 90:
        return CongestionLevel.high
    return CongestionLevel.critical


def format_route_as_static_steps(path: PathResult, zones: dict[str, Zone]) -> RouteOption:
    steps: list[RouteStep] = []
    for index, zone_id in enumerate(path.zones):
        zone_name = zones[zone_id].name if zone_id in zones else zone_id
        if index == 0:
            instruction = f"Start at {zone_name}."
        else:
            instruction = f"Continue to {zone_name}."
        steps.append(RouteStep(instruction=instruction, zoneId=zone_id))

    return RouteOption(
        steps=steps,
        estimatedMinutes=max(1, ceil(path.cost)),
        congestionLevel=congestion_level_for_path(path.zones, zones),
    )


def get_route(
    from_zone_id: str,
    to_zone_id: str,
    accessibility_needs: list[AccessibilityNeed],
    db: firestore.Client | None = None,
) -> RouteResponse:
    graph = load_zone_graph()
    if AccessibilityNeed.wheelchair in accessibility_needs:
        graph = remove_edges_tagged(graph, "stairs_only")

    firestore_client = db or get_firestore_client()
    zones = load_zones(firestore_client)
    missing = [zone_id for zone_id in (from_zone_id, to_zone_id) if zone_id not in graph or zone_id not in zones]
    if missing:
        raise ResourceNotFoundError(f"Zone not found: {', '.join(missing)}")
    baseline = dijkstra_shortest_path(graph, from_zone_id, to_zone_id, zones)
    alternatives = find_comparable_alternatives(graph, baseline, from_zone_id, to_zone_id, zones)

    try:
        route_options = wayfindingFlow(
            baseline.zones,
            [alternative.zones for alternative in alternatives],
            accessibility_needs,
        )
        return RouteResponse(routeOptions=route_options, generatedBy="ai")
    except (AIServiceError, ValueError):
        return RouteResponse(
            routeOptions=[format_route_as_static_steps(baseline, zones)],
            generatedBy="fallback",
        )
