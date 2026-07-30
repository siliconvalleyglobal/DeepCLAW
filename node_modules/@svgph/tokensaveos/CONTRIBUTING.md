# Contributing to TokenSaveOS

Thank you for your interest in contributing to **TokenSaveOS**, an open-source AI agent optimization platform by **SILICON VALLEY GLOBAL PH INC**.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/siliconvalleyglobal/TokenSaveOS.git
cd TokenSaveOS

# Install dependencies
npm install

# Build monorepo packages
npm run build

# Run unit test suite
npm test
```

## Contribution Guidelines
1. Maintain strict modular interface boundaries (`packages/core/src/types.ts`).
2. Ensure secret redactions (`redactSecrets()`) are enforced before any memory or prompt persistence.
3. Run `npm test` to verify all Vitest regression tests pass cleanly before submitting pull requests.

## License
By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
