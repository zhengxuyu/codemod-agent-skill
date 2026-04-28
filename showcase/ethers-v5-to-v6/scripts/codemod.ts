import type { Codemod, Edit } from "codemod:ast-grep";
import type { SgNode } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

/**
 * ethers.js v5 → v6: BigNumber to native BigInt migration
 */

const ARITHMETIC: Record<string, string> = {
  add: "+", sub: "-", mul: "*", div: "/", mod: "%",
};

const COMPARISON: Record<string, string> = {
  eq: "===", gt: ">", lt: "<", gte: ">=", lte: "<=",
};

const ALL_METHODS = { ...ARITHMETIC, ...COMPARISON };

const CONSTANTS: Record<string, string> = {
  Zero: "0n", One: "1n", Two: "2n",
  MaxUint256: "ethers.MaxUint256", MinInt256: "ethers.MinInt256",
  AddressZero: "ethers.ZeroAddress", HashZero: "ethers.ZeroHash",
};

// Test assertion patterns — skip these to avoid false positives on chai/jest .eq()
const ASSERTION_KEYWORDS = /\b(expect|should|assert|to\.be|to\.equal|to\.deep)\b/;

/**
 * Recursively transform a BigNumber expression to its BigInt equivalent.
 * Handles chains like: amount.add(fee).mul(rate) → ((amount + fee) * rate)
 */
function transformExpr(node: SgNode<TSX>): string | null {
  if (node.kind() !== "call_expression") return null;

  const funcNode = node.field("function");
  if (!funcNode) return null;

  // BigNumber.from(x) or ethers.BigNumber.from(x)
  if (funcNode.kind() === "member_expression") {
    const prop = funcNode.field("property");
    const obj = funcNode.field("object");
    if (!prop || !obj) return null;
    const propName = prop.text();
    const objText = obj.text();

    // BigNumber.from(x) → BigInt(x)
    if (propName === "from" && (objText === "BigNumber" || objText === "ethers.BigNumber")) {
      const args = node.field("arguments");
      if (!args) return null;
      const inner = args.text().slice(1, -1);
      return `BigInt(${inner})`;
    }

    // .add/.sub/.mul etc — arithmetic & comparison
    const operator = ALL_METHODS[propName];
    if (operator) {
      // Guard: skip if this looks like a test assertion (chai .eq(), jest .toBe(), etc.)
      const fullText = node.text();
      if (ASSERTION_KEYWORDS.test(fullText)) return null;

      const args = node.field("arguments");
      if (!args) return null;
      const rhs = args.text().slice(1, -1);

      // Recursively transform the object (handles chains)
      const lhs = transformExpr(obj) ?? obj.text();
      return `(${lhs} ${operator} ${rhs})`;
    }

    // .isZero() → === 0n
    if (propName === "isZero") {
      const lhs = transformExpr(obj) ?? obj.text();
      return `(${lhs} === 0n)`;
    }

    // .isNegative() → < 0n
    if (propName === "isNegative") {
      const lhs = transformExpr(obj) ?? obj.text();
      return `(${lhs} < 0n)`;
    }

    // .toNumber() → Number(x)
    if (propName === "toNumber") {
      const lhs = transformExpr(obj) ?? obj.text();
      return `Number(${lhs})`;
    }

    // .toHexString() → toBeHex(x)
    if (propName === "toHexString") {
      const lhs = transformExpr(obj) ?? obj.text();
      return `toBeHex(${lhs})`;
    }
  }

  return null;
}

const codemod: Codemod<TSX> = async (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // Find ALL call expressions with member access
  const allCalls = rootNode.findAll({
    rule: {
      kind: "call_expression",
      has: {
        field: "function",
        kind: "member_expression",
      },
    },
  });

  // Track which nodes we've already handled (to avoid double-transforming nested chains)
  const handled = new Set<number>();

  // Sort outermost first — we process from outermost and recurse inward
  const sorted = [...allCalls].sort(
    (a, b) => (b.range().end.index - b.range().start.index) - (a.range().end.index - a.range().start.index)
  );

  for (const node of sorted) {
    // Skip if this node is inside a node we already transformed
    if (handled.has(node.range().start.index)) continue;

    const result = transformExpr(node);
    if (result !== null) {
      edits.push({
        startPos: node.range().start.index,
        endPos: node.range().end.index,
        insertedText: result,
      });

      // Mark all descendant positions as handled
      const start = node.range().start.index;
      const end = node.range().end.index;
      for (const other of allCalls) {
        const os = other.range().start.index;
        if (os > start && os < end) {
          handled.add(os);
        }
      }
    }
  }

  // ethers.constants.X → replacement
  const constantsAccess = rootNode.findAll({
    rule: {
      kind: "member_expression",
      pattern: "ethers.constants.$CONST",
    },
  });

  for (const node of constantsAccess) {
    const constName = node.getMatch("CONST")?.text();
    if (constName && CONSTANTS[constName]) {
      edits.push({
        startPos: node.range().start.index,
        endPos: node.range().end.index,
        insertedText: CONSTANTS[constName],
      });
    }
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
