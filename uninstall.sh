#!/usr/bin/env bash
#
# Uninstaller for claude-aspm-scan
# Removes the /aspm-scan skill from ~/.claude/commands/
#

set -euo pipefail

DEST="$HOME/.claude/commands/aspm-scan.md"

if [[ -f "$DEST" ]]; then
  rm "$DEST"
  echo ""
  echo "  claude-aspm-scan uninstalled — removed $DEST"
  echo ""
else
  echo "  Nothing to remove — $DEST does not exist."
fi
