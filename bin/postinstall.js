#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const COMMAND_NAME = "aspm-scan.md";
const SRC = path.join(__dirname, "..", "commands", COMMAND_NAME);
const DEST_DIR = path.join(os.homedir(), ".claude", "commands");
const DEST = path.join(DEST_DIR, COMMAND_NAME);

try {
  // Create ~/.claude/commands/ if it doesn't exist
  fs.mkdirSync(DEST_DIR, { recursive: true });

  // Copy the command file
  fs.copyFileSync(SRC, DEST);

  console.log("");
  console.log("  claude-aspm-scan installed successfully!");
  console.log("");
  console.log("  Skill installed to: " + DEST);
  console.log("  Usage:  Type /aspm-scan in Claude Code");
  console.log("");
} catch (err) {
  console.error("");
  console.error("  Warning: Could not auto-install the Claude Code skill.");
  console.error("  Error: " + err.message);
  console.error("");
  console.error("  Manual install:");
  console.error("    mkdir -p ~/.claude/commands");
  console.error("    cp node_modules/claude-aspm-scan/commands/aspm-scan.md ~/.claude/commands/");
  console.error("");
  // Don't fail the npm install — this is a best-effort convenience
  process.exit(0);
}
