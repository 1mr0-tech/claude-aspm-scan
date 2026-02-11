#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const COMMAND_NAME = "aspm-scan.md";
const DEST = path.join(os.homedir(), ".claude", "commands", COMMAND_NAME);

try {
  if (fs.existsSync(DEST)) {
    fs.unlinkSync(DEST);
    console.log("");
    console.log("  claude-aspm-scan uninstalled — removed " + DEST);
    console.log("");
  }
} catch (err) {
  console.error("  Warning: Could not remove " + DEST + ": " + err.message);
  console.error("  You can delete it manually: rm " + DEST);
  process.exit(0);
}
