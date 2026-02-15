# Chain Map

[![CI](https://github.com/thegaram/chain-map/actions/workflows/ci.yml/badge.svg)](https://github.com/thegaram/chain-map/actions/workflows/ci.yml)

A local-first web app for tracking and inspecting smart contract deployments across multiple chains.

## Features

- 🗺️ **Multi-chain inventory** - Track contracts across Ethereum, L2s, and other EVM chains
- 📦 **Local-first** - All data stored in JSON files you control (File System Access API)
- 🔍 **On-chain inspection** - Fetch bytecode, detect proxies (EIP-1967, EIP-1167), verify codehashes
- 🎨 **Clean UI** - Keyboard-first, minimal design with light/dark mode
- 🔗 **Read-only URL loading** - Share and explore inventories via HTTPS URLs
- 💾 **ABI management** - Store ABIs and make read-only contract calls

## Architecture

**Stack**: Svelte + Vite + viem

**Storage**: Static SPA with no backend. Data persists to local JSON files via File System Access API, with download/upload fallback.

**Structure**:
- `inventory.json` - Contract metadata and chain configuration
- `abis/` - Separate ABI files (lazy-loaded)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking, linting, formatting
npm run check

# Build for production
npm run build
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run check` - Run all checks (typecheck + lint + format)

## License

MIT
