import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

/**
 * wagmi v1 → v2: Hook renames, component renames, import updates
 */

const HOOK_RENAMES: Record<string, string> = {
  useContractRead: "useReadContract",
  useContractReads: "useReadContracts",
  useContractWrite: "useWriteContract",
  useContractEvent: "useWatchContractEvent",
  useContractInfiniteReads: "useInfiniteReadContracts",
  useFeeData: "useEstimateFeesPerGas",
  useSwitchNetwork: "useSwitchChain",
  useWaitForTransaction: "useWaitForTransactionReceipt",
  usePrepareContractWrite: "useSimulateContract",
  usePrepareSendTransaction: "useEstimateGas",
};

const COMPONENT_RENAMES: Record<string, string> = {
  WagmiConfig: "WagmiProvider",
};

const ABI_RENAMES: Record<string, string> = {
  erc20ABI: "erc20Abi",
  erc721ABI: "erc721Abi",
  erc4626ABI: "erc4626Abi",
};

const TYPE_RENAMES: Record<string, string> = {
  WagmiConfigProps: "WagmiProviderProps",
};

const ALL_RENAMES: Record<string, string> = {
  ...HOOK_RENAMES,
  ...COMPONENT_RENAMES,
  ...ABI_RENAMES,
  ...TYPE_RENAMES,
};

const codemod: Codemod<TSX> = async (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Rename in import specifiers
  const importSpecifiers = rootNode.findAll({
    rule: {
      kind: "import_specifier",
    },
  });

  for (const spec of importSpecifiers) {
    const nameNode = spec.field("name");
    if (!nameNode) continue;
    const name = nameNode.text();
    const rename = ALL_RENAMES[name];
    if (rename) {
      edits.push({
        startPos: nameNode.range().start.index,
        endPos: nameNode.range().end.index,
        insertedText: rename,
      });
    }
  }

  // 2. Rename hook call sites
  for (const [oldName, newName] of Object.entries(HOOK_RENAMES)) {
    const calls = rootNode.findAll({
      rule: {
        kind: "call_expression",
        has: {
          field: "function",
          kind: "identifier",
          regex: `^${oldName}$`,
        },
      },
    });

    for (const node of calls) {
      const funcNode = node.field("function");
      if (!funcNode) continue;
      edits.push({
        startPos: funcNode.range().start.index,
        endPos: funcNode.range().end.index,
        insertedText: newName,
      });
    }
  }

  // 3. Rename JSX components: <WagmiConfig> → <WagmiProvider>
  for (const [oldName, newName] of Object.entries(COMPONENT_RENAMES)) {
    for (const kind of ["jsx_opening_element", "jsx_closing_element", "jsx_self_closing_element"]) {
      const tags = rootNode.findAll({
        rule: {
          kind,
          has: {
            field: "name",
            kind: "identifier",
            regex: `^${oldName}$`,
          },
        },
      });

      for (const tag of tags) {
        const nameNode = tag.field("name");
        if (!nameNode) continue;
        edits.push({
          startPos: nameNode.range().start.index,
          endPos: nameNode.range().end.index,
          insertedText: newName,
        });
      }
    }
  }

  // 4. Rename ABI identifiers at usage sites (not imports, handled above)
  for (const [oldName, newName] of Object.entries(ABI_RENAMES)) {
    const ids = rootNode.findAll({
      rule: {
        kind: "identifier",
        regex: `^${oldName}$`,
      },
    });

    for (const node of ids) {
      // Skip if already handled by import specifier edits
      const parent = node.parent();
      if (parent && parent.kind() === "import_specifier") continue;
      edits.push({
        startPos: node.range().start.index,
        endPos: node.range().end.index,
        insertedText: newName,
      });
    }
  }

  // 5. Rename type references
  for (const [oldType, newType] of Object.entries(TYPE_RENAMES)) {
    const typeRefs = rootNode.findAll({
      rule: {
        kind: "type_identifier",
        regex: `^${oldType}$`,
      },
    });

    for (const node of typeRefs) {
      edits.push({
        startPos: node.range().start.index,
        endPos: node.range().end.index,
        insertedText: newType,
      });
    }
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
