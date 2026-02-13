# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **local-first, static web application** for tracking smart contract deployments across multiple chains. This is a single-page app with **no backend or hosted service**. All state persists to user-controlled JSON files via the File System Access API.

**Core Principle**: Simplicity and aesthetic minimalism. Keyboard-first interactions.

## Tech Stack

- **Framework**: Svelte
- **Build Tool**: Vite
- **Blockchain Library**: viem
- **Distribution**: Compiled HTML/CSS/JS static bundle

## Development Commands

Standard Vite workflow (once package.json is created):

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture

### Storage Model

The app uses the File System Access API (with import/export fallback):

- **inventory.json** - Metadata for all contracts (schemaVersion, settings, chain RPC config, contract records)
- **abis/abi_<id>.json** - Separate ABI blob files, lazy-loaded

### Data Flow

1. **Boot**: Load inventory.json → Apply theme → Lazy load ABIs
2. **Search/Filter**: Derived view with debounced fuzzy matching
3. **Drawer Open**: Show metadata immediately → Load RPC data on tab activation
4. **Persistence**: Explicit save writes JSON files

### Component Hierarchy

```
App
 ├ TopBar (search, filters, actions, theme toggle)
 ├ ContractTable (dense scrollable list)
 ├ Drawer (right-side)
 │  ├ DetailsTab (editable metadata)
 │  ├ OnChainTab (bytecode, codehash, proxy detection)
 │  └ AbiTab (ABI management, read-only calls)
 ├ StorageManager (File System Access API)
 ├ RpcManager (multi-endpoint health checks)
 ├ VerificationHelper (bundle generation)
 └ ThemeManager (light/dark mode)
```

### Source Layout

```
src/
  components/    # Svelte UI components
  lib/
    stores/      # State management
    chain/       # RPC interaction, proxy detection
    storage/     # File I/O, persistence
    verification/ # Verification bundle generation
  main.ts
```

## Key Design Constraints

### V1 Non-Goals

Do **not** implement these in initial version:
- Wallet signing or transaction submission
- Multi-user sync
- IndexedDB persistence
- Automated verification API submission

### UI Design Principles

- **Table-first layout**: Main table with right-side drawer
- **Monochrome base palette** with minimal iconography
- **No heavy shadows**, high whitespace ratio
- **Keyboard shortcuts**: Ctrl/Cmd+K (search focus), N (new record), R (refresh RPC)

### On-chain Inspection

- **RPC Strategy**: Global per-chain URL list with health-check based selection
- **Codehash**: keccak256 of runtime bytecode
- **Proxy Detection**: EIP-1967 storage slot + EIP-1167 pattern matching

## Data Schema

### Contract Record Fields

Each record in inventory.json contains:
- id, label, address, chainId
- type (implementation/proxy indicator)
- tags (array for categorization)
- source (repo reference)
- expectedCodehash
- abiId (link to separate ABI file)
- verificationStatus
- notes, timestamps

### ABI Blob Structure

Separate file per ABI:
- abiId
- metadata
- abi (JSON array)

## Implementation Phases

The project follows a phased roadmap:

0. **Scaffold**: Project setup and layout skeleton
1. **Data Schema**: Inventory store implementation
2. **Table UI**: Filtering and display
3. **File Storage**: File System Access API integration
4. **On-chain**: RPC inspection features
5. **ABI System**: Interaction and read calls
6. **Verification**: Helper bundle generation

When implementing features, respect the phase order to maintain architectural coherence.

## Theming

CSS variable token system with priority:
1. User preference (explicit toggle)
2. Stored setting (localStorage)
3. System media query (prefers-color-scheme)

Ensure all components use CSS variables, not hardcoded colors.
