# Case Study: Automating ethers.js v5 → v6 Migration with AI + Codemod

## Migration Target

**Library:** ethers.js  
**From:** v5 (BigNumber class)  
**To:** v6 (native BigInt)  
**Scope:** BigNumber API → native operators + utility functions

This is one of the most requested migrations in the Web3 ecosystem. ethers v6 replaced the `BigNumber` class with native `BigInt`, breaking virtually every DeFi frontend. The [official migration guide](https://docs.ethers.org/v6/migrating/) lists 40+ breaking changes.

## Approach: Codemod Skill + JSSG

Rather than manually writing a one-off migration script, we used our **Codemod AI Agent Skill** to guide the process:

1. **Searched registry** — `npx codemod search ethers` → no existing codemod found
2. **Scaffolded** — `npx codemod init ethers-v5-to-v6 --project-type ast-grep-js`
3. **Identified patterns** — read migration guide, extracted 16 transformation rules
4. **Wrote JSSG transform** — recursive handler for chained BigNumber operations
5. **Tested with fixtures** — 7 test cases covering all pattern categories
6. **Validated on real project** — ran against Uniswap v3-periphery test suite

## Technical Implementation

### Key challenge: Chained method calls

```typescript
// Input
amount.add(fee).mul(rate).div(precision)

// Naive approach breaks this (only transforms outermost)
// Our approach: recursive descent from outermost, transforming inward
// Output
(((amount + fee) * rate) / precision)
```

### False positive prevention

chai/jest assertion methods (`.eq()`, `.gt()`) share names with BigNumber methods. Our guard:

```typescript
const ASSERTION_KEYWORDS = /\b(expect|should|assert|to\.be|to\.equal)\b/;
// Skip transforming if the expression is inside a test assertion
```

## Results

**Test suite:** 7/7 fixture tests passing  

**Real-world validation (Uniswap v3-periphery):**
- Files processed: 31
- Lines transformed: 76
- False positives: 0 (chai `.eq()` correctly preserved)
- Patterns covered: BigNumber.from, arithmetic (.add/.sub/.mul/.div/.mod), comparison (.eq/.gt/.lt/.gte/.lte), .isZero(), .toNumber(), .toHexString(), ethers.constants.*
- Execution time: 0.056s

**Coverage estimate:** ~80% of BigNumber-related patterns automated. Remaining 20% requires contextual judgment (e.g., `.toString('base64')` on non-BigNumber objects, complex data flow analysis).

## AI vs Manual Effort

| Task | With Skill | Manual |
|------|-----------|--------|
| Research breaking changes | 10 min (web search) | 30 min |
| Write transform | 30 min (guided by JSSG templates) | 3-4 hours |
| Write tests | 10 min (fixture pairs) | 1 hour |
| Validate on real project | 5 min (one command) | 2-3 hours |
| **Total** | **~1 hour** | **7+ hours** |

## Conclusion

The Codemod AI Agent Skill reduces the barrier to building production-grade codemods from "expert AST knowledge required" to "describe what you want to migrate." By encoding Codemod platform expertise into a reusable skill, any AI agent can produce high-quality, tested, publishable migration tools — making framework upgrades systematically automatable.
