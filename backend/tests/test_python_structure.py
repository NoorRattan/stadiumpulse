import ast
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRECTORIES = {".pytest_cache", ".ruff_cache", ".venv", "__pycache__"}
MAX_FILE_LINES = 500
MAX_FUNCTION_LINES = 75


def _first_party_python_files() -> list[Path]:
    return sorted(
        path
        for path in BACKEND_ROOT.rglob("*.py")
        if not EXCLUDED_DIRECTORIES.intersection(path.relative_to(BACKEND_ROOT).parts)
    )


def _function_span(node: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    decorated_start = min((decorator.lineno for decorator in node.decorator_list), default=node.lineno)
    return (node.end_lineno or node.lineno) - decorated_start + 1


def test_backend_python_structure_stays_within_maintainability_limits() -> None:
    violations: list[str] = []
    for path in _first_party_python_files():
        relative_path = path.relative_to(BACKEND_ROOT)
        source = path.read_text(encoding="utf-8")
        line_count = len(source.splitlines())
        if line_count > MAX_FILE_LINES:
            violations.append(f"{relative_path}: file has {line_count} lines (limit {MAX_FILE_LINES})")
        tree = ast.parse(source, filename=str(relative_path))
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                span = _function_span(node)
                if span > MAX_FUNCTION_LINES:
                    violations.append(
                        f"{relative_path}:{node.lineno} {node.name} has {span} lines (limit {MAX_FUNCTION_LINES})"
                    )
    assert not violations, "Backend Python structure violations:\n" + "\n".join(violations)
