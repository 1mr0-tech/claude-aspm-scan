#!/usr/bin/env bash
#
# Manual installer for claude-aspm-scan
# Copies the /aspm-scan skill into ~/.claude/commands/
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMAND_SRC="$SCRIPT_DIR/commands/aspm-scan.md"
DEST_DIR="$HOME/.claude/commands"
DEST="$DEST_DIR/aspm-scan.md"

if [[ ! -f "$COMMAND_SRC" ]]; then
  echo "Error: commands/aspm-scan.md not found in $SCRIPT_DIR"
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$COMMAND_SRC" "$DEST"

echo ""
echo "  claude-aspm-scan installed successfully!"
echo ""
echo "  Skill installed to: $DEST"
echo "  Usage:  Type /aspm-scan in Claude Code"
echo ""
