# Demo Video Script (2-3 minutes)

## Setup
- Terminal open, full screen, dark theme, large font (16pt+)
- Split screen if possible: left = terminal, right = code editor

---

## [0:00-0:15] Hook — The Problem

**Show:** A large TypeScript file full of `BigNumber.from()`, `.add()`, `.mul()` calls

**Voiceover:**
> "Framework migrations are the most boring part of software engineering. ethers.js v6 replaced BigNumber with native BigInt — breaking every DeFi frontend. Manually rewriting 600+ lines across 30 files takes days. What if your AI agent could do it in seconds?"

---

## [0:15-0:40] Install the Skill

**Type in terminal:**
```bash
cp -r skills/codemod/ .claude/skills/codemod/
```

**Voiceover:**
> "Install one skill file. That's it. Your AI agent now knows how to use the Codemod platform — how to search for existing codemods, build new ones, test them, and publish them to the registry."

---

## [0:40-1:30] Live Demo — Build a Codemod

**Show:** Ask Claude Code "Build a codemod to migrate ethers v5 BigNumber to v6 BigInt"

**Agent follows the skill workflow:**
1. Searches registry → nothing found
2. Scaffolds project with `npx codemod init`
3. Writes the JSSG transform
4. Runs tests: `npx codemod jssg test` → **7/7 passing**

**Voiceover:**
> "The agent follows the skill's 4-step workflow. It searches the registry first — nothing exists. So it scaffolds a new codemod project, writes the AST-based transform using JSSG, and runs fixture tests. Seven out of seven passing."

---

## [1:30-2:00] Validate on Real Project

**Type:**
```bash
npx codemod jssg run --language tsx --target /path/to/uniswap-v3 --dry-run
```

**Show:** The diff output — 76 lines changed, clean transformations

**Voiceover:**
> "Now validate on a real project. Running against Uniswap v3-periphery — 31 files processed, 76 lines transformed, zero false positives. Chained operations like `.add().mul()` are handled correctly. The whole thing takes 0.05 seconds."

---

## [2:00-2:20] Generality — Second Showcase

**Show:** wagmi v1→v2 test results (4/4 passing)

**Voiceover:**
> "The skill isn't limited to one migration. Here's wagmi v1 to v2 — completely different pattern, hook renames and JSX component renames. Same skill, same workflow, built in minutes. Four out of four tests passing."

---

## [2:20-2:40] The Big Picture

**Show:** The skill file (SKILL.md) — scroll through the sections

**Voiceover:**
> "One skill file. Works with Claude Code, Codex, OpenClaw, Cursor — any agent that can read instructions and run terminal commands. Install it once, and every framework migration becomes a conversation, not a project."

---

## [2:40-2:50] Closing

**Show:** The published codemod on the registry (if published) or the GitHub repo

**Voiceover:**
> "One skill, unlimited codemods, every migration automated. Links in the description."

---

## Recording Tips
- Use a screen recorder (OBS, QuickTime, or Loom)
- Terminal font size: 16pt minimum
- Keep commands visible for 2-3 seconds before executing
- No need to show real-time agent thinking — cut/edit for pacing
- Add subtle background music if you want (optional)
- Total target: 2:30-2:50
