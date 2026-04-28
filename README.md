# Codemod Agent Skill

> Make any AI coding agent a Codemod expert — from "migrate X to Y" to a tested, published codemod in one conversation.

## The Problem

Framework migrations are the #1 time sink in software maintenance. The [Codemod platform](https://codemod.com) has the best open-source toolkit to automate them (ast-grep based, 20+ languages, zero false positives by design). But AI coding agents don't know it exists.

**Result:** Developers still spend days manually rewriting code for every upgrade, or AI agents produce unreliable regex-based transformations that break in production.

## The Solution

A single skill file (`SKILL.md`) that teaches any AI coding agent the complete Codemod workflow. Install it once, and your agent can:

1. **Search** the Codemod registry for existing migration recipes
2. **Build** new codemods using JSSG (ast-grep + TypeScript) when none exist
3. **Test** with fixture-based input/expected pairs
4. **Validate** on real open-source projects with coverage metrics
5. **Publish** to the Codemod registry for the community

## Quick Start

### For Claude Code users

```bash
# Clone this repo
git clone https://github.com/zhengxuyu/codemod-agent-skill.git

# Copy the skill into your project
cp -r codemod-agent-skill/skills/codemod/ your-project/.claude/skills/codemod/
```

Then ask Claude Code: **"Migrate my project from ethers v5 to v6"** — it will follow the skill automatically.

### For OpenAI Codex / OpenClaw / Cursor

Copy `skills/codemod/SKILL.md` into your agent's skill/instruction directory. The skill uses standard CLI commands — no Claude-specific features.

### For any agent with tool/instruction support

The skill is a single Markdown file. Paste it into your agent's system prompt or instruction set. It works with any agent that can run terminal commands.

## How It Works

```
You: "Migrate wagmi v1 to v2"
      │
      ▼
┌─────────────────────────────────────────────────┐
│  SKILL.md loaded by your AI agent               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Step 1: DISCOVER                               │
│  $ npx codemod search "wagmi v1 v2"            │
│  → No existing codemod found                   │
│                                                 │
│  Step 2: BUILD                                  │
│  $ npx codemod init wagmi-v1-to-v2 ...         │
│  → Agent writes JSSG transform + tests          │
│                                                 │
│  Step 3: VALIDATE                               │
│  $ npx codemod jssg test ...                    │
│  → 4/4 tests pass                              │
│  $ npx codemod jssg run --target ./real-project │
│  → 80%+ coverage, 0 false positives            │
│                                                 │
│  Step 4: PUBLISH                                │
│  $ npx codemod publish                          │
│  → Available for everyone via registry          │
│                                                 │
└─────────────────────────────────────────────────┘
      │
      ▼
You: Done. Migration automated.
```

## What the Skill Teaches the Agent

| Topic | What the agent learns |
|-------|----------------------|
| **JSSG API** | `findAll()`, rules (kind, pattern, regex, has, inside), `commitEdits()` |
| **Common patterns** | Rename functions, replace method calls with operators, update imports |
| **Testing** | Fixture structure (`tests/<case>/input.ts` + `expected.ts`), running tests |
| **Validation** | Dry-run on real repos, false positive detection, coverage calculation |
| **Constraints** | Zero FP policy, conservative scope, null return for no-change files |

## Showcases

Two complete codemods built using this skill, proving it works across different migration types:

### 1. ethers.js v5 → v6 (BigNumber → BigInt)

Complex AST transformation with recursive chain handling.

| Pattern | v5 | v6 |
|---------|----|----|
| Construction | `BigNumber.from(x)` | `BigInt(x)` |
| Arithmetic | `.add(x)` `.sub(x)` `.mul(x)` `.div(x)` | `+ x` `- x` `* x` `/ x` |
| Comparison | `.eq(x)` `.gt(x)` `.lt(x)` | `=== x` `> x` `< x` |
| Predicates | `.isZero()` `.isNegative()` | `=== 0n` `< 0n` |
| Conversion | `.toNumber()` `.toHexString()` | `Number(x)` `toBeHex(x)` |
| Constants | `ethers.constants.Zero` | `0n` |

- **7/7 tests passing**
- Handles chained calls: `a.add(b).mul(c)` → `((a + b) * c)`
- Guards against chai/jest false positives
- Validated on Uniswap v3-periphery (31 files, 76 lines, 0 FP)

### 2. wagmi v1 → v2 (Hook & Component Renames)

Deterministic identifier renames across imports, call sites, and JSX.

| Category | Examples |
|----------|----------|
| Hook renames (10) | `useContractRead` → `useReadContract`, `useSwitchNetwork` → `useSwitchChain` |
| Component renames | `<WagmiConfig>` → `<WagmiProvider>` |
| ABI renames | `erc20ABI` → `erc20Abi` |
| Type renames | `WagmiConfigProps` → `WagmiProviderProps` |

- **4/4 tests passing**
- Handles imports, call sites, JSX tags, and type references in one pass

## Project Structure

```
├── skills/
│   └── codemod/
│       └── SKILL.md               ← The skill (main deliverable)
├── showcase/
│   ├── ethers-v5-to-v6/          ← Showcase 1: complex AST transforms
│   │   ├── scripts/codemod.ts
│   │   └── tests/ (7 cases)
│   └── wagmi-v1-to-v2/           ← Showcase 2: identifier renames
│       ├── scripts/codemod.ts
│       └── tests/ (4 cases)
├── case-study.md                  ← Detailed migration case study
└── README.md
```

## Why This Matters for the Codemod Ecosystem

This skill is the **distribution layer** for Codemod adoption in the AI agent ecosystem:

- Every developer using Claude Code, Codex, or Cursor gains instant Codemod expertise
- Every codemod built through the skill gets published to the registry → more community recipes
- Framework maintainers can point users to "install this skill and run the migration" instead of writing docs

**One skill → unlimited codemods → every migration automated.**

## Compatibility

| Platform | Install method | Status |
|----------|---------------|--------|
| Claude Code | `.claude/skills/codemod/SKILL.md` | ✅ Tested |
| OpenAI Codex | Skill/instruction file | ✅ Compatible |
| OpenClaw | Skill registry | ✅ Compatible |
| Cursor | `.cursor/rules/` | ✅ Compatible |
| Any agent | System prompt / instruction | ✅ Universal |

## License

MIT
