import { venueNodes, type VenueNode } from "./venueNetworkData";

export { venueNodes } from "./venueNetworkData";

export interface ProjectedNode extends VenueNode {
  screenX: number;
  screenY: number;
  depth: number;
}

export interface Star {
  opacity: number;
  r: number;
  x: number;
  y: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

interface Palette {
  amber: string;
  cyan: string;
  foreground: string;
  isDark: boolean;
  magenta: string;
}

interface Frame {
  centerX: number;
  centerY: number;
  context: CanvasRenderingContext2D;
  height: number;
  palette: Palette;
  radius: number;
  width: number;
}

interface RenderInput {
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  pulse: number;
  rotation: { x: number; y: number };
  selected: VenueNode;
  stars: Star[];
}

export const radians = (degrees: number): number => (degrees * Math.PI) / 180;

function readColor(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function isDarkBackground(background: string): boolean {
  const value = background.replace(/\s/g, "");
  return ["#0", "#1", "rgb(1", "rgb(0"].some((prefix) =>
    value.startsWith(prefix),
  );
}

function palette(): Palette {
  const background = readColor("--background", "#0b1121");
  return {
    amber: readColor("--brand-amber", "#fbbf24"),
    cyan: readColor("--brand-cyan", "#00f0ff"),
    foreground: readColor("--foreground", "#f1f5f9"),
    isDark: isDarkBackground(background),
    magenta: readColor("--brand-magenta", "#ff007f"),
  };
}

function prepareFrame(
  canvas: HTMLCanvasElement,
  container: HTMLDivElement,
): Frame | null {
  const rect = container.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, rect.width);
  const height = Math.max(390, rect.height);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return {
    centerX: width / 2,
    centerY: height * 0.47,
    context,
    height,
    palette: palette(),
    radius: Math.min(width * 0.36, height * 0.36),
    width,
  };
}

function rotatePoint(
  latitude: number,
  longitude: number,
  rotation: { x: number; y: number },
): Point {
  const lat = radians(latitude);
  const lon = radians(longitude);
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  const rotatedX = x * Math.cos(rotation.y) + z * Math.sin(rotation.y);
  const rotatedZ = z * Math.cos(rotation.y) - x * Math.sin(rotation.y);
  return {
    x: rotatedX,
    y: y * Math.cos(rotation.x) - rotatedZ * Math.sin(rotation.x),
    z: y * Math.sin(rotation.x) + rotatedZ * Math.cos(rotation.x),
  };
}

function projector(frame: Frame, rotation: { x: number; y: number }) {
  return (latitude: number, longitude: number): Point => {
    const point = rotatePoint(latitude, longitude, rotation);
    const perspective = 0.9 + point.z * 0.11;
    return {
      x: frame.centerX + point.x * frame.radius * perspective,
      y: frame.centerY - point.y * frame.radius * perspective,
      z: point.z,
    };
  };
}

function drawStars(frame: Frame, stars: Star[]): void {
  const {
    centerX,
    centerY,
    context,
    height,
    palette: colors,
    radius,
    width,
  } = frame;
  for (const star of stars) {
    const x = star.x * width;
    const y = star.y * (height * 0.88);
    const distance = Math.hypot(x - centerX, y - centerY);
    const opacity = star.opacity * Math.min(1, distance / (radius * 0.7));
    if (opacity < 0.02) continue;
    context.beginPath();
    context.arc(x, y, star.r, 0, Math.PI * 2);
    context.fillStyle = colors.isDark
      ? `rgba(200,230,255,${opacity})`
      : `rgba(0,100,140,${opacity * 0.35})`;
    context.fill();
  }
}

function drawAtmosphere(frame: Frame): void {
  const {
    centerX,
    centerY,
    context,
    height,
    palette: colors,
    radius,
    width,
  } = frame;
  const glow = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.2,
    centerX,
    centerY,
    radius * 1.45,
  );
  if (colors.isDark) {
    glow.addColorStop(0, `${colors.magenta}1a`);
    glow.addColorStop(0.45, `${colors.cyan}12`);
    glow.addColorStop(0.75, `${colors.amber}08`);
  } else {
    glow.addColorStop(0, `${colors.magenta}12`);
    glow.addColorStop(0.5, `${colors.cyan}0a`);
  }
  glow.addColorStop(1, "transparent");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
}

function sphereGradient(frame: Frame): CanvasGradient {
  const { centerX, centerY, context, palette: colors, radius } = frame;
  const sphere = context.createRadialGradient(
    centerX - radius * 0.32,
    centerY - radius * 0.34,
    radius * 0.04,
    centerX,
    centerY,
    radius * 1.05,
  );
  if (colors.isDark) {
    sphere.addColorStop(0, `${colors.cyan}30`);
    sphere.addColorStop(0.28, `${colors.magenta}18`);
    sphere.addColorStop(0.62, "rgba(8,20,50,0.55)");
    sphere.addColorStop(1, `${colors.magenta}10`);
  } else {
    sphere.addColorStop(0, `${colors.cyan}22`);
    sphere.addColorStop(0.35, `${colors.magenta}12`);
    sphere.addColorStop(0.72, "rgba(200,230,245,0.3)");
    sphere.addColorStop(1, `${colors.amber}08`);
  }
  return sphere;
}

function drawSphere(frame: Frame): void {
  const { centerX, centerY, context, palette: colors, radius } = frame;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = sphereGradient(frame);
  context.fill();
  const specular = context.createRadialGradient(
    centerX - radius * 0.38,
    centerY - radius * 0.42,
    0,
    centerX - radius * 0.38,
    centerY - radius * 0.42,
    radius * 0.55,
  );
  specular.addColorStop(0, `rgba(255,255,255,${colors.isDark ? 0.12 : 0.22})`);
  specular.addColorStop(1, "transparent");
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = specular;
  context.fill();
}

function drawGridLine(
  frame: Frame,
  points: Array<{ latitude: number; longitude: number }>,
  project: (latitude: number, longitude: number) => Point,
): void {
  const { context, palette: colors } = frame;
  for (let index = 1; index < points.length; index += 1) {
    const previous = project(
      points[index - 1].latitude,
      points[index - 1].longitude,
    );
    const current = project(points[index].latitude, points[index].longitude);
    const front = (previous.z + current.z) / 2 > 0;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(current.x, current.y);
    context.strokeStyle = front
      ? colors.isDark
        ? `${colors.cyan}85`
        : `${colors.cyan}60`
      : colors.isDark
        ? "rgba(50,80,100,0.45)"
        : "rgba(0,120,160,0.22)";
    context.lineWidth = front ? 1.1 : 0.65;
    context.stroke();
  }
}

function drawGrid(
  frame: Frame,
  project: (latitude: number, longitude: number) => Point,
): void {
  for (let latitude = -75; latitude <= 75; latitude += 15) {
    drawGridLine(
      frame,
      Array.from({ length: 73 }, (_, index) => ({
        latitude,
        longitude: -180 + index * 5,
      })),
      project,
    );
  }
  for (let longitude = -180; longitude < 180; longitude += 15) {
    drawGridLine(
      frame,
      Array.from({ length: 37 }, (_, index) => ({
        latitude: -90 + index * 5,
        longitude,
      })),
      project,
    );
  }
}

function drawOrbit(
  frame: Frame,
  {
    angle,
    scale,
    shadow,
    stroke,
    width,
  }: {
    angle: number;
    scale: number;
    shadow: string;
    stroke: string | CanvasGradient;
    width: number;
  },
): void {
  const { centerX, centerY, context, palette: colors, radius } = frame;
  context.save();
  context.translate(centerX, centerY);
  context.rotate(radians(angle));
  context.scale(1, scale);
  context.beginPath();
  context.ellipse(0, 0, radius * width, radius * width, 0, 0, Math.PI * 2);
  context.strokeStyle = stroke;
  context.lineWidth = width > 1.4 ? 2.8 : 1.8;
  context.shadowBlur = colors.isDark ? 18 : 8;
  context.shadowColor = shadow;
  context.stroke();
  context.restore();
}

function drawOrbits(frame: Frame): void {
  const { context, palette: colors, radius } = frame;
  const gradient = context.createLinearGradient(
    -radius * 1.48,
    0,
    radius * 1.48,
    0,
  );
  gradient.addColorStop(0, colors.cyan);
  gradient.addColorStop(0.45, colors.magenta);
  gradient.addColorStop(1, colors.amber);
  drawOrbit(frame, {
    angle: -11,
    scale: 0.22,
    shadow: colors.magenta,
    stroke: gradient,
    width: 1.48,
  });
  drawOrbit(frame, {
    angle: 22,
    scale: 0.18,
    shadow: colors.cyan,
    stroke: colors.isDark ? `${colors.cyan}90` : `${colors.cyan}70`,
    width: 1.35,
  });
}

function projectNodes(
  project: (latitude: number, longitude: number) => Point,
): ProjectedNode[] {
  return venueNodes
    .map((venue) => {
      const point = project(venue.latitude, venue.longitude);
      return { ...venue, screenX: point.x, screenY: point.y, depth: point.z };
    })
    .sort((a, b) => a.depth - b.depth);
}

function nodeCoreColor(colors: Palette, active: boolean): string {
  if (active) return colors.magenta;
  return colors.isDark ? colors.cyan : `${colors.cyan}cc`;
}

function drawActiveLabel(
  context: CanvasRenderingContext2D,
  colors: Palette,
  node: ProjectedNode,
): void {
  context.font = "700 11px 'JetBrains Mono Variable', monospace";
  context.fillStyle = colors.foreground;
  context.textAlign = "center";
  context.shadowBlur = 8;
  context.shadowColor = colors.magenta;
  context.fillText(node.code, node.screenX, node.screenY - 20);
  context.shadowBlur = 0;
}

function drawNode(
  frame: Frame,
  node: ProjectedNode,
  selected: VenueNode,
  pulse: number,
): void {
  const { context, palette: colors } = frame;
  const active = node.code === selected.code;
  if (node.depth <= -0.15 && !active) return;
  const size = active ? 7.5 : 3 + Math.max(0, node.depth) * 2.5;
  const haloScale = active ? 1 + 0.35 * Math.sin(pulse * 0.06) : 1;
  const haloSize = (active ? size * 2.8 : size * 2) * haloScale;
  const halo = context.createRadialGradient(
    node.screenX,
    node.screenY,
    0,
    node.screenX,
    node.screenY,
    haloSize,
  );
  halo.addColorStop(0, active ? `${colors.magenta}40` : `${colors.cyan}28`);
  halo.addColorStop(1, "transparent");
  context.beginPath();
  context.arc(node.screenX, node.screenY, haloSize, 0, Math.PI * 2);
  context.fillStyle = halo;
  context.fill();
  context.beginPath();
  context.arc(node.screenX, node.screenY, size, 0, Math.PI * 2);
  context.fillStyle = nodeCoreColor(colors, active);
  context.shadowBlur = active ? 28 : 14;
  context.shadowColor = active ? colors.magenta : colors.cyan;
  context.fill();
  context.shadowBlur = 0;
  if (active) drawActiveLabel(context, colors, node);
}

function drawNodes(
  frame: Frame,
  nodes: ProjectedNode[],
  selected: VenueNode,
  pulse: number,
): void {
  for (const node of nodes) drawNode(frame, node, selected, pulse);
}

function segmentColor(colors: Palette, active: boolean): string {
  if (colors.isDark)
    return active ? "rgba(0,240,255,0.75)" : "rgba(0,240,255,0.18)";
  return active ? "rgba(0,108,117,0.75)" : "rgba(0,108,117,0.18)";
}

function drawHud(frame: Frame, selected: VenueNode): void {
  const { context, height, palette: colors, width } = frame;
  const y = height - 14;
  const opacity = colors.isDark ? 0.55 : 0.5;
  context.font = "700 9px 'JetBrains Mono Variable', monospace";
  context.fillStyle = colors.isDark
    ? `rgba(148,163,184,${opacity})`
    : `rgba(71,85,105,${opacity})`;
  context.textAlign = "left";
  context.fillText(
    `LAT ${selected.latitude.toFixed(2)} · LNG ${selected.longitude.toFixed(2)}`,
    18,
    y,
  );
  const pulseX = width - 18 - 8 * 8 - 56;
  context.textAlign = "right";
  context.fillStyle = colors.isDark
    ? `rgba(0,240,255,${opacity + 0.1})`
    : `rgba(0,108,117,${opacity + 0.1})`;
  context.fillText("PULSE-OK", pulseX, y);
  for (let index = 0; index < 8; index += 1) {
    context.fillStyle = segmentColor(colors, index < 6);
    context.beginPath();
    context.roundRect(pulseX + 8 + index * 8, y - 8, 6, 10, 1.5);
    context.fill();
  }
}

export function createVenueStars(): Star[] {
  let seed = 42;
  const random = (): number => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 120 }, () => ({
    x: random(),
    y: random(),
    r: random() * 1.4 + 0.3,
    opacity: random() * 0.6 + 0.15,
  }));
}

export function renderVenueScene(input: RenderInput): ProjectedNode[] {
  const frame = prepareFrame(input.canvas, input.container);
  if (!frame) return [];
  const project = projector(frame, input.rotation);
  drawStars(frame, input.stars);
  drawAtmosphere(frame);
  drawSphere(frame);
  drawGrid(frame, project);
  drawOrbits(frame);
  const nodes = projectNodes(project);
  drawNodes(frame, nodes, input.selected, input.pulse);
  drawHud(frame, input.selected);
  return nodes;
}
