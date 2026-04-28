# ethers-v5-to-v6

Migrate ethers.js v5 BigNumber to native BigInt (ethers v6)

## Installation

```bash
# Install from registry
codemod run ethers-v5-to-v6

# Or run locally
codemod run -w workflow.yaml
```

## Usage

This codemod transforms tsx code by:

- Converting `var` declarations to `const`/`let`
- Removing debug statements
- Modernizing syntax patterns

## Development

```bash
# Test the transformation
npm test

# Validate the workflow
codemod validate -w workflow.yaml

# Publish to registry
codemod login
codemod publish
```

## License

MIT 