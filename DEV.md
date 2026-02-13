# Development Guide

## Getting Started

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── TopBar.svelte           # Search, filters, actions
│   ├── ContractTable.svelte    # Main table view
│   ├── Drawer.svelte           # Right-side drawer
│   ├── DetailsTab.svelte       # Contract details editor
│   ├── OnChainTab.svelte       # RPC inspection view
│   └── AbiTab.svelte           # ABI management/interaction
├── lib/
│   ├── stores/                 # State management (to be implemented)
│   ├── chain/                  # RPC, proxy detection (to be implemented)
│   ├── storage/                # File I/O (to be implemented)
│   └── verification/           # Verification helpers (to be implemented)
├── app.css              # Global styles + theme system
└── main.ts              # Application entry point
```

## Current Status

✅ **Completed:**
- Project scaffolding with Vite + Svelte + TypeScript
- Complete UI component structure
- Theme system (light/dark mode with CSS variables)
- Responsive layout (table + drawer)
- All component placeholders with mock data

🚧 **Next Steps (per CLAUDE.md phases):**
1. Implement data schema and stores
2. Add search/filter functionality
3. Integrate File System Access API
4. Add RPC inspection features
5. Build ABI interaction system
6. Create verification helpers

## Theme System

The app supports light and dark modes with automatic detection:
1. User preference (toggle button)
2. Stored setting (localStorage)
3. System preference (prefers-color-scheme)

All colors use CSS variables defined in `src/app.css`.

## Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + K` - Focus search
- `N` - Add new record
- `R` - Refresh RPC data

## Tech Stack

- **Framework**: Svelte 5
- **Build**: Vite 5
- **Language**: TypeScript
- **Blockchain**: viem
- **Styling**: CSS (no framework, minimal design)
