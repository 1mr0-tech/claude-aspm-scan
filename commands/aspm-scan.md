---
description: Run ASPM security scan (Semgrep SAST + optional Shannon pentest) and generate ASPM_SCAN.md
argument-hint: "[--shannon --url=<app-url> --semgrep-config=<config> --skip-semgrep]"
allowed-tools: Bash, Read, Write, Grep, Glob
---

You are an Application Security Posture Management (ASPM) assistant. Run security scans and produce a consolidated `ASPM_SCAN.md` report in the project root.

## Step 0: Parse Arguments

Parse `$ARGUMENTS` for these flags:

| Flag | Effect |
|---|---|
| `--shannon` | Enable Shannon autonomous pentest (requires Docker + ANTHROPIC_API_KEY) |
| `--url=<URL>` | Target URL for Shannon (e.g. `--url=http://localhost:3000`) |
| `--semgrep-config=<config>` | Custom Semgrep ruleset (default: `auto`) |
| `--skip-semgrep` | Skip Semgrep scan entirely |

If no arguments are provided, run Semgrep only with default config.

Store the parsed values in shell variables for use in later steps. Determine the project name from the basename of the current working directory. Record the scan start time.

## Step 1: Preflight Checks

Run these checks sequentially. Track which tools are available. **Never abort entirely** — if a tool is unavailable, note it and continue with what works.

### 1a. Python / pip
Run `which python3` and `which pip3`. If missing, warn the user but continue (Semgrep may already be installed standalone).

### 1b. Semgrep
1. Run `which semgrep`
2. If not found, check `~/.local/bin/semgrep`
3. If still not found and `--skip-semgrep` is NOT set, attempt: `pip3 install semgrep --break-system-packages 2>/dev/null || pip3 install semgrep`
4. After install attempt, verify with `semgrep --version`
5. If all attempts fail, warn user and set a flag to skip Semgrep

### 1c. Docker (only if `--shannon` flag is set)
1. Run `docker info > /dev/null 2>&1`
2. If Docker is not available or not running, warn user: "Docker is required for Shannon but is not available. Skipping Shannon."
3. Set a flag to skip Shannon if Docker check fails

### 1d. Shannon (only if `--shannon` AND Docker is available)
1. Check if `~/.claude/tools/shannon/shannon` exists
2. If not, attempt:
   ```
   mkdir -p ~/.claude/tools/shannon
   cd ~/.claude/tools/shannon
   git clone https://github.com/shannon-ai/shannon.git . 2>/dev/null
   docker compose build
   ```
3. If clone/build fails, warn and skip Shannon

### 1e. ANTHROPIC_API_KEY (only if `--shannon` AND Shannon is installed)
1. Check if `$ANTHROPIC_API_KEY` is set
2. If not, warn: "ANTHROPIC_API_KEY is required for Shannon. Skipping Shannon."

Print a summary of preflight results showing which tools are ready.

## Step 2: Run Semgrep SAST Scan

Skip this step if `--skip-semgrep` is set or Semgrep is not available.

### 2a. Run JSON scan for structured parsing
```bash
semgrep scan --config <config> --json --output /tmp/semgrep-results.json . 2>/tmp/semgrep-stderr.txt
```
Use the user-supplied `--semgrep-config` value or default to `auto`.

### 2b. Run text scan for human-readable output
```bash
semgrep scan --config <config> --output /tmp/semgrep-results.txt . 2>/tmp/semgrep-text-stderr.txt
```

### 2c. Parse the JSON results
Read `/tmp/semgrep-results.json` and extract:
- Total findings count
- Severity breakdown (Critical, High, Medium, Low, Info/Warning)
- List of affected files
- For each finding: rule ID, severity, file path, line number, code snippet, message, and CWE/OWASP references if available

Handle gracefully:
- If `--json` output is empty or malformed, fall back to parsing the text output
- If Semgrep exits with non-zero but produces partial output, use whatever was produced
- Capture stderr for the appendix

## Step 3: Run Shannon Autonomous Pentest (Conditional)

**Only run this step if ALL of these are true:**
- `--shannon` flag was provided
- Docker is available
- Shannon is installed
- `ANTHROPIC_API_KEY` is set

### 3a. Warn the user
Print this warning and wait 5 seconds:
```
WARNING: Shannon autonomous pentest will:
- Cost approximately $50 in API fees (uses ANTHROPIC_API_KEY)
- Take 1-1.5 hours to complete
- Actively probe the target application

Proceeding in 5 seconds...
```

### 3b. Setup
```bash
# Symlink project into Shannon's repos directory
ln -sfn "$(pwd)" ~/.claude/tools/shannon/repos/target-project
```

### 3c. Run Shannon
```bash
cd ~/.claude/tools/shannon
if [ -n "$TARGET_URL" ]; then
    ./shannon start REPO=target-project URL="$TARGET_URL"
else
    ./shannon start REPO=target-project
fi
```

### 3d. Collect Results
After Shannon completes, read results from `~/.claude/tools/shannon/audit-logs/`. Look for the most recent log directory and parse findings from it.

## Step 4: Generate ASPM_SCAN.md

Write the report to `ASPM_SCAN.md` in the project root using the Write tool. If writing fails (permissions, etc.), fall back to `/tmp/ASPM_SCAN.md` and inform the user.

The report MUST follow this exact structure:

```markdown
# ASPM Security Scan Report

**Project:** <project-name>
**Scan Date:** <YYYY-MM-DD HH:MM:SS>
**Tools Used:** <list of tools that actually ran>
**Scan Duration:** <elapsed time>

---

## Executive Summary

<1-2 paragraph posture assessment based on findings. Include:
- Total finding count across all tools
- Critical/High finding highlights
- Overall risk assessment: Critical / High / Medium / Low>

---

## Risk Score Matrix

| Severity | Semgrep SAST | Shannon Pentest | Total |
|----------|-------------|-----------------|-------|
| Critical | X | X | X |
| High | X | X | X |
| Medium | X | X | X |
| Low | X | X | X |
| Info | X | X | X |
| **Total** | **X** | **X** | **X** |

---

## Semgrep SAST Findings

<If Semgrep was skipped or unavailable, note that here and skip to next section.>

### Critical Findings
<For each critical finding>
#### <Rule ID>
- **Severity:** Critical
- **File:** `<file>:<line>`
- **CWE:** <CWE-ID if available>
- **Description:** <rule message>
- **Code:**
  ```<language>
  <code snippet>
  ```
- **Remediation:** <suggested fix based on the rule>

### High Findings
<same format>

### Medium Findings
<same format>

### Low Findings
<same format>

---

## Shannon Pentest Findings

<If Shannon was not run, include:>
> Shannon autonomous pentest was not executed in this scan. Use `--shannon` flag to enable.

<If Shannon was run, organize findings into:>
### Confirmed Exploits
<findings Shannon confirmed as exploitable>

### Potential Vulnerabilities
<findings Shannon identified but could not confirm>

---

## Cross-Tool Correlation

<Identify findings that overlap between tools. For example, if Semgrep flags an SQL injection and Shannon confirms it exploitable, note the correlation. If only one tool ran, note that cross-correlation requires multiple tools.>

---

## Recommendations

### Immediate (Critical/High)
<Numbered list of actions for critical and high findings>

### Short-Term (Medium)
<Numbered list of actions for medium findings>

### Long-Term (Low/Informational)
<Numbered list of actions for low and info findings>

---

## Appendix

### Tool Versions
- Semgrep: <version>
- Shannon: <version or N/A>
- Python: <version>

### Scan Configuration
- Semgrep config: <config used>
- Shannon target URL: <URL or N/A>

### Raw Output Paths
- Semgrep JSON: `/tmp/semgrep-results.json`
- Semgrep Text: `/tmp/semgrep-results.txt`
- Semgrep Stderr: `/tmp/semgrep-stderr.txt`
- Shannon Logs: <path or N/A>

### Errors and Warnings
<Any stderr output, warnings, or issues encountered during the scan>
```

## Step 5: Summary and Cleanup

### 5a. Print summary to user
Display a concise summary:
```
ASPM Scan Complete!
Report: ./ASPM_SCAN.md

Findings Summary:
  Critical: X
  High:     X
  Medium:   X
  Low:      X
  Info:     X
  Total:    X

Tools: Semgrep ✓ | Shannon ✗ (not requested)
```

### 5b. Cleanup
- If Shannon containers were started, run: `cd ~/.claude/tools/shannon && docker compose down 2>/dev/null`
- Remove the symlink: `rm -f ~/.claude/tools/shannon/repos/target-project 2>/dev/null`
- Do NOT remove the temp files (they're referenced in the appendix)

### 5c. Suggest next steps
Based on findings, suggest:
- If critical/high findings: "Review critical findings immediately. Run `/aspm-scan` again after fixing to verify."
- If Shannon wasn't run: "Consider running with `--shannon --url=<your-app-url>` for deeper penetration testing."
- If clean scan: "No significant findings. Consider scheduling periodic scans."

## Error Handling Rules

1. **Never halt entirely on a single tool failure** — always produce a partial report with whatever data was collected
2. **Capture all stderr** — include it in the Appendix section
3. **File write fallback** — if `ASPM_SCAN.md` can't be written to the project root, write to `/tmp/ASPM_SCAN.md` instead
4. **Network issues** — if Semgrep can't download rules, try `--config r/generic` as fallback, then `--config p/default`
5. **Large repos** — if Semgrep times out, suggest the user run with `--semgrep-config=p/security-audit` for a faster focused scan
6. **Permission errors** — if pip install fails, try with `--user` flag
7. **Path issues** — always check both system PATH and `~/.local/bin` for installed tools
