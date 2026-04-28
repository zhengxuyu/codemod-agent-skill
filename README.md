# Codemod AI Agent Skill

> 🏆 Submission for [Boring AI Hackathon](https://dorahacks.io/hackathon/boring-ai) on DoraHacks

## What is this?

An **AI agent skill** that teaches Claude Code, Codex, OpenClaw, and other AI coding agents how to use the [Codemod platform](https://codemod.com) to build, test, validate, and publish production-grade code migration tools.

Instead of writing one codemod, we built **the skill that enables any AI agent to write unlimited codemods**.

## Why it matters

Every engineering team struggles with framework migrations. Codemod has the best toolkit for this, but AI agents don't know how to use it. This skill bridges that gap:

- Agent receives "migrate ethers v5 to v6" → follows the skill workflow → produces a tested, published codemod
- Zero human intervention needed for the mechanical parts
- Human judgment preserved for ambiguous transformations

## Install

**Claude Code:**
```bash
# Copy to your project
cp -r skills/codemod/ .claude/skills/codemod/

# Or symlink globally
ln -s $(pwd)/skills/codemod ~/.claude/skills/codemod
```

**Other agents (Codex, OpenClaw, Cursor):**
Copy `skills/codemod/SKILL.md` into your agent's skill directory.

## What the skill covers

```
User: "Migrate X to Y"
      ↓
1. DISCOVER — search Codemod registry for existing codemods
2. BUILD    — scaffold JSSG project + write AST transform + fixture tests
3. VALIDATE — run on real open-source project, measure coverage
4. PUBLISH  — publish to Codemod registry
```

## Showcase: ethers.js v5 → v6 (BigNumber → BigInt)

Built using this skill as proof-of-concept. Located in `showcase/ethers-v5-to-v6/`.

**Patterns automated:**
| v5 | v6 |
|----|-----|
| `BigNumber.from(x)` | `BigInt(x)` |
| `.add(x)` / `.sub(x)` / `.mul(x)` / `.div(x)` | `+ x` / `- x` / `* x` / `/ x` |
| `.eq(x)` / `.gt(x)` / `.lt(x)` | `=== x` / `> x` / `< x` |
| `.isZero()` | `=== 0n` |
| `.toNumber()` | `Number(x)` |
| `.toHexString()` | `toBeHex(x)` |
| `ethers.constants.Zero` | `0n` |
| `ethers.constants.AddressZero` | `ethers.ZeroAddress` |

**Validation (Uniswap v3-periphery):**
- 31 files processed
- 76 lines transformed
- 0 false positives on assertion chains (chai `.eq()` correctly preserved)
- Chained operations handled correctly: `a.add(b).mul(c)` → `((a + b) * c)`

## Project Structure

```
├── skills/codemod/SKILL.md    ← The skill (main deliverable)
├── showcase/ethers-v5-to-v6/  ← Proof it works
├── case-study.md              ← Migration case study
└── README.md                  ← This file
```

## Compatibility

| Agent | Status |
|-------|--------|
| Claude Code | ✅ Tested |
| OpenAI Codex | ✅ Compatible (skill format) |
| OpenClaw | ✅ Compatible |
| Cursor | ✅ Compatible (rules format) |

## License

MIT
