#!/usr/bin/env python3
"""Block agent edits that reduce active expect( calls in Playwright test files."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

TEST_FILE_RE = re.compile(
    r"tests/.*\.(spec|test)\.[jt]sx?$",
    re.IGNORECASE,
)


def read_hook_input() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        print("guard-test-assertions: empty stdin", file=sys.stderr)
        sys.exit(1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"guard-test-assertions: invalid JSON — {exc}", file=sys.stderr)
        sys.exit(1)


def normalize_path(file_path: str) -> str:
    return file_path.replace("\\", "/")


def is_test_file(file_path: str) -> bool:
    return bool(TEST_FILE_RE.match(normalize_path(file_path)))


def count_active_expects(content: str) -> int:
    total = 0
    for line in content.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        code_part = line.split("//", 1)[0]
        total += code_part.count("expect(")
    return total


def reconstruct_before(after_content: str, edits: list) -> str | None:
    content = after_content
    for edit in reversed(edits):
        if not isinstance(edit, dict):
            return None
        old_string = edit.get("old_string")
        new_string = edit.get("new_string")
        if old_string is None or new_string is None:
            return None
        if new_string not in content:
            return None
        content = content.replace(new_string, old_string, 1)
    return content


def block_message(file_path: str, before: int, after: int) -> str:
    return (
        f"Blocked: test assertions weakened in {file_path} — active expect( "
        f"count {before} -> {after}. Do not delete or comment out assertions to "
        f"make tests pass. Fix the app, locator, or test data instead."
    )


def main() -> None:
    payload = read_hook_input()
    file_path = payload.get("file_path")
    if not file_path:
        print("guard-test-assertions: missing file_path", file=sys.stderr)
        sys.exit(1)

    if not is_test_file(file_path):
        sys.exit(0)

    edits = payload.get("edits") or []
    path = Path(file_path)
    if not path.is_file():
        print(f"guard-test-assertions: file not found — {file_path}", file=sys.stderr)
        sys.exit(1)

    after_content = path.read_text(encoding="utf-8")
    after_count = count_active_expects(after_content)

    before_content = reconstruct_before(after_content, edits)
    if before_content is not None:
        before_count = count_active_expects(before_content)
    else:
        delta = 0
        for edit in edits:
            if not isinstance(edit, dict):
                continue
            old_s = edit.get("old_string") or ""
            new_s = edit.get("new_string") or ""
            delta += count_active_expects(old_s) - count_active_expects(new_s)
        before_count = after_count + delta

    if before_count > after_count:
        msg = block_message(file_path, before_count, after_count)
        out = {"user_message": msg, "agent_message": msg}
        print(json.dumps(out))
        print(msg, file=sys.stderr)
        sys.exit(2)

    print(
        f"guard-test-assertions: OK — {after_count} active expect( preserved",
        file=sys.stderr,
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
