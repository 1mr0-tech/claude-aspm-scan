# claude-aspm-scan

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill that runs **Application Security Posture Management (ASPM)** scans on your codebase and generates a structured `ASPM_SCAN.md` report.

It combines **Semgrep SAST** (static analysis) with an optional **Shannon autonomous pentest** to give you a single-command security assessment from inside Claude Code.

## Features

- **One-command security scan** — type `/aspm-scan` in Claude Code
- **Semgrep SAST** — static analysis with 3,000+ community rules (default: `auto` config)
- **Shannon pentest** (opt-in) — autonomous penetration testing via Docker
- **Multi-language** — scans JavaScript, TypeScript, Python, Go, Java, Ruby, and more
- **Structured report** — generates `ASPM_SCAN.md` with executive summary, risk matrix, findings by severity, remediation advice, and cross-tool correlation
- **Zero config** — works out of the box; Semgrep is auto-installed if missing

## Installation

### npm (recommended)

```bash
npm install -g claude-aspm-scan
```

This automatically copies the skill to `~/.claude/commands/aspm-scan.md`. It's ready to use immediately in Claude Code.

### Manual

```bash
git clone https://github.com/YOUR_USERNAME/claude-aspm-scan.git
cd claude-aspm-scan
bash install.sh
```

Or copy the file yourself:

```bash
mkdir -p ~/.claude/commands
cp commands/aspm-scan.md ~/.claude/commands/
```

## Uninstall

### npm

```bash
npm uninstall -g claude-aspm-scan
```

### Manual

```bash
bash uninstall.sh
# or simply:
rm ~/.claude/commands/aspm-scan.md
```

## Usage

Open any project in Claude Code and type:

```
/aspm-scan
```

That's it. Semgrep runs against your codebase and the results are written to `ASPM_SCAN.md` in your project root.

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| *(none)* | Run Semgrep with default `auto` config | — |
| `--semgrep-config=<config>` | Use a custom Semgrep ruleset | `auto` |
| `--skip-semgrep` | Skip Semgrep entirely (useful if only running Shannon) | off |
| `--shannon` | Enable Shannon autonomous pentest (requires Docker) | off |
| `--url=<URL>` | Target URL for Shannon (e.g. `http://localhost:3000`) | — |

### Examples

**Default scan** — Semgrep with auto rules:

```
/aspm-scan
```

**Custom ruleset** — use OWASP top 10 rules only:

```
/aspm-scan --semgrep-config=p/owasp-top-ten
```

**Full scan with Shannon pentest:**

```
/aspm-scan --shannon --url=http://localhost:3000
```

**Shannon only (skip Semgrep):**

```
/aspm-scan --shannon --url=http://localhost:3000 --skip-semgrep
```

## What the Report Looks Like

`ASPM_SCAN.md` contains:

```
# ASPM Security Scan Report

**Project:** my-app
**Scan Date:** 2026-02-10 14:30:00
**Tools Used:** Semgrep SAST
**Scan Duration:** 45s

---

## Executive Summary

The scan identified 12 findings across the codebase...

## Risk Score Matrix

| Severity | Semgrep SAST | Shannon Pentest | Total |
|----------|-------------|-----------------|-------|
| Critical | 1           | —               | 1     |
| High     | 3           | —               | 3     |
| Medium   | 5           | —               | 5     |
| Low      | 3           | —               | 3     |

## Semgrep SAST Findings

### Critical Findings
#### hardcoded-api-key
- **Severity:** Critical
- **File:** `src/config.js:15`
- **CWE:** CWE-798
- **Description:** Hardcoded API key detected...

...

## Recommendations

### Immediate (Critical/High)
1. Rotate the exposed API key in src/config.js
2. Parameterize SQL queries in src/db.js
...
```

## Prerequisites

| Tool | Required | Notes |
|------|----------|-------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Yes | The CLI where this skill runs |
| [Semgrep](https://semgrep.dev) | Auto-installed | Installed automatically on first run if not present |
| Python 3 / pip | Recommended | Needed to install Semgrep |
| [Docker](https://www.docker.com) | For Shannon only | Required if using `--shannon` flag |
| `ANTHROPIC_API_KEY` | For Shannon only | Shannon uses Claude for autonomous pentesting |

## Testing

The package includes a test suite with intentionally vulnerable files that validate Semgrep detection across multiple vulnerability classes and languages.

### Run the tests

```bash
npm test
# or directly:
bash tests/run-aspm-tests.sh
```

### What the tests cover

The test harness scans two intentionally vulnerable files and verifies Semgrep detects:

**JavaScript** (`tests/vulnerable-app.js`):

| Vulnerability | CWE |
|---------------|-----|
| Command Injection | CWE-78 |
| SQL Injection | CWE-89 |
| Code Injection (eval) | CWE-94 |
| Path Traversal | CWE-22 |
| XSS (Reflected) | CWE-79 |
| Hardcoded Secret | CWE-798 |
| SSRF | CWE-918 |
| Weak Crypto (MD5) | CWE-327 |

**Python** (`tests/vulnerable-app.py`):

| Vulnerability | CWE |
|---------------|-----|
| SQL Injection | CWE-89 |
| Command Injection | CWE-78 |
| Hardcoded Password | CWE-798 |
| Insecure Deserialization | CWE-502 |

The test harness:

1. Verifies Semgrep is available (installs if needed)
2. Runs `semgrep scan --config auto --json` against the test files
3. Asserts at least 8 findings are detected
4. Checks each vulnerability class is found by matching rule IDs
5. Validates the JSON output has all fields needed for report generation
6. Reports pass/fail for 25 assertions

### Expected output

```
Phase 1: Environment Setup
  PASS: jq is available
  PASS: Semgrep is available (v1.151.0)
  ...

Phase 3: Validate Findings
  PASS: At least 8 findings detected (got 24)
  PASS: Command Injection (CWE-78) detected
  PASS: SQL Injection (CWE-89) detected
  ...

Phase 5: Test Results Summary
  Passed: 25 / 25
  Failed: 0 / 25

  ALL TESTS PASSED
```

## How It Works

1. **Preflight** — checks for Semgrep (auto-installs if missing), Docker, Shannon, and `ANTHROPIC_API_KEY`
2. **Semgrep scan** — runs `semgrep scan --config auto --json` and a parallel text scan
3. **Shannon pentest** *(if `--shannon`)* — runs an autonomous pentest against the target URL
4. **Report generation** — parses all findings and writes `ASPM_SCAN.md` with executive summary, risk matrix, detailed findings, remediation, and appendix
5. **Cleanup** — tears down Shannon containers if started, prints summary

The skill never aborts entirely on a single tool failure. If Semgrep can't install, it warns you and skips. If Shannon fails, you still get the Semgrep report.

## Project Structure

```
claude-aspm-scan/
├── commands/
│   └── aspm-scan.md        # The Claude Code skill
├── bin/
│   ├── postinstall.js      # npm postinstall — copies skill to ~/.claude/commands/
│   └── preuninstall.js     # npm preuninstall — removes skill
├── tests/
│   ├── vulnerable-app.js   # Intentionally vulnerable JS (8 vuln classes)
│   ├── vulnerable-app.py   # Intentionally vulnerable Python (4 vuln classes)
│   └── run-aspm-tests.sh   # Automated test harness (25 assertions)
├── install.sh              # Manual install script
├── uninstall.sh            # Manual uninstall script
├── package.json
├── LICENSE
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Run the tests: `npm test`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin my-feature`
7. Open a Pull Request

## License

MIT
