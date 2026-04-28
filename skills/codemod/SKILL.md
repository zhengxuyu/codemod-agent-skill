---
name: codemod
description: "Build, test, validate, and publish codemods using the Codemod platform (JSSG/ast-grep). Use when user wants to migrate frameworks, automate code transformations, or build production-grade codemods."
---

# Codemod — AI Agent Skill

You are an expert at using the Codemod platform to build production-grade code migrations. You guide users from "I need to migrate X→Y" to a published, tested, validated codemod.

## Prerequisites

Before starting, verify the Codemod CLI is available:

```bash
npx codemod --version
```

If not installed or outdated, it auto-downloads via npx. No manual install needed.

## Workflow Overview

```
User: "Migrate framework X to Y"
    ↓
1. DISCOVER — check if a codemod already exists
2. BUILD    — scaffold + write JSSG transform + test
3. VALIDATE — run on real project, measure coverage
4. PUBLISH  — publish to Codemod registry
```

---

## 1. Discovery — Search Before Building

Always check the registry first:

```bash
npx codemod search "<framework> <version>"
```

**If a codemod exists:**
```bash
npx codemod @scope/package-name ./target-directory
```
Done. No need to build.

**If nothing found → proceed to Build.**

---

## 2. Build — Create a New Codemod

### 2a. Scaffold

```bash
npx codemod init <name> \
  --project-type ast-grep-js \
  --language tsx \
  --package-manager npm \
  --author "<author>" \
  --license MIT \
  --no-interactive
```

This creates:
```
<name>/
├── scripts/codemod.ts     ← Your transform logic
├── workflow.yaml           ← Execution config
├── codemod.yaml           ← Package metadata
└── tests/                 ← Fixture tests
```

### 2b. Research Breaking Changes

Before writing code, gather ALL breaking changes from:
- Official migration guide
- GitHub issues/discussions
- Changelog

List each change as a pattern: `before → after`.

### 2c. Write the JSSG Transform

Edit `scripts/codemod.ts`. The structure is always:

```typescript
import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

const codemod: Codemod<TSX> = async (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // Find patterns and create edits
  const nodes = rootNode.findAll({
    rule: { /* your rule here */ }
  });

  for (const node of nodes) {
    edits.push({
      startPos: node.range().start.index,
      endPos: node.range().end.index,
      insertedText: "replacement code",
    });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
```

### JSSG API Quick Reference

**Finding nodes:**
```typescript
rootNode.findAll({
  rule: {
    kind: "call_expression",           // AST node type
    pattern: "someFunc($$$ARGS)",      // Pattern with captures
    regex: "^prefix",                  // Regex on node text
    has: { field: "property", kind: "identifier", regex: "^name$" },  // Child constraint
    inside: { kind: "function_declaration" },  // Parent constraint
  }
})
```

**Accessing node data:**
```typescript
node.text()                    // Source text of the node
node.kind()                    // AST node type string
node.field("name")             // Access named child field
node.range().start.index       // Byte offset start
node.range().end.index         // Byte offset end
node.getMatch("$VAR")         // Get pattern capture
node.parent()                  // Parent node
node.ancestors()               // All ancestors
```

**Creating edits:**
```typescript
// Option A: node.replace() shorthand
const edit = node.replace("new code");

// Option B: manual edit object
const edit: Edit = {
  startPos: node.range().start.index,
  endPos: node.range().end.index,
  insertedText: "new code",
};
```

**Committing:**
```typescript
return rootNode.commitEdits(edits);  // Returns modified source string
```

### Common Transform Patterns

**Rename a function call:**
```typescript
const calls = rootNode.findAll({
  rule: { kind: "call_expression", pattern: "oldFunc($$$ARGS)" }
});
const edits = calls.map(n => {
  const args = n.getMatch("ARGS")?.text() ?? "";
  return n.replace(`newFunc(${args})`);
});
```

**Replace method call with operator:**
```typescript
const calls = rootNode.findAll({
  rule: {
    kind: "call_expression",
    has: {
      field: "function",
      kind: "member_expression",
      has: { field: "property", kind: "property_identifier", regex: "^add$" }
    }
  }
});
for (const node of calls) {
  const obj = node.field("function")!.field("object")!.text();
  const args = node.field("arguments")!.text().slice(1, -1);
  edits.push({
    startPos: node.range().start.index,
    endPos: node.range().end.index,
    insertedText: `(${obj} + ${args})`,
  });
}
```

**Replace member expression (constants):**
```typescript
const nodes = rootNode.findAll({
  rule: { kind: "member_expression", pattern: "ethers.constants.$CONST" }
});
for (const node of nodes) {
  const name = node.getMatch("CONST")?.text();
  const map: Record<string, string> = { Zero: "0n", One: "1n", MaxUint256: "ethers.MaxUint256" };
  if (map[name!]) edits.push(node.replace(map[name!]));
}
```

**Update import specifiers:**
```typescript
const imports = rootNode.findAll({
  rule: { kind: "import_specifier", has: { kind: "identifier", regex: "^OldName$" } }
});
for (const node of imports) {
  edits.push(node.replace("NewName"));
}
```

### 2d. Write Tests

Create fixture pairs in `tests/`:

```
tests/
├── case-name/
│   ├── input.ts       ← Code before transform
│   └── expected.ts    ← Expected code after transform
```

Each test case should cover ONE specific pattern. Keep inputs minimal (3-10 lines).

### 2e. Run Tests

```bash
npx codemod jssg test --language tsx ./scripts/codemod.ts ./tests
```

All tests must pass. If a test fails, read the diff carefully:
- Wrong output → fix the transform logic
- Expected is wrong → update expected.ts

---

## 3. Validate — Run on a Real Project

### 3a. Find a Target Project

Look for a popular open-source project that uses the old framework version:
```bash
# Example: find projects using ethers v5
gh search repos "ethers dependencies" --language TypeScript --sort stars
```

### 3b. Clone and Run

```bash
git clone <target-repo> /tmp/validation-target
npx codemod jssg run ./scripts/codemod.ts /tmp/validation-target --language tsx --dry-run
```

Review the diff. Look for:
- **False positives** (incorrect changes) — CRITICAL, must be zero
- **False negatives** (missed patterns) — acceptable, document them

### 3c. Apply and Verify

```bash
# Apply changes
npx codemod jssg run ./scripts/codemod.ts /tmp/validation-target --language tsx

# Verify
cd /tmp/validation-target
npm install
npm run build    # Must pass
npm test         # Must pass (or document known failures)
```

### 3d. Calculate Score

```
N  = total patterns that should be transformed
FP = false positives (incorrect transformations)
FN = false negatives (missed patterns)

Coverage = (N - FN) / N × 100%
Score = 100 × (1 − ((FP × 2) + (FN × 1)) / (N × 3))
```

Target: **80%+ coverage, zero FP.**

---

## 4. Publish

```bash
npx codemod login
npx codemod publish

# Verify
npx codemod search <your-codemod-name>
```

---

## Hard Constraints

1. **JSSG only** — never use jscodeshift. Codemod platform uses ast-grep (JSSG).
2. **Zero false positives** — better to miss a pattern than to transform incorrectly.
3. **dry-run first** — always preview changes before applying.
4. **Test before publish** — all fixture tests must pass.
5. **Conservative scope** — only transform patterns you're 100% certain about. Leave ambiguous/context-dependent cases for AI review.
6. **Return null for no changes** — if nothing to transform, return `null` not the original source.
7. **One concern per codemod** — don't mix unrelated transforms in one file. Use workflows for multi-step migrations.

## Workflow: Multi-step Migrations

For complex migrations with many breaking changes, split into stages in `workflow.yaml`:

```yaml
version: "1"

nodes:
  - id: step-1-bignumber
    name: Migrate BigNumber to BigInt
    type: automatic
    steps:
      - name: "Transform BigNumber patterns"
        js-ast-grep:
          js_file: scripts/bignumber.ts
          language: "tsx"

  - id: step-2-providers
    name: Migrate Provider classes
    type: automatic
    depends_on: [step-1-bignumber]
    steps:
      - name: "Transform Provider patterns"
        js-ast-grep:
          js_file: scripts/providers.ts
          language: "tsx"
```

Each step is independently testable and has its own test fixtures.
