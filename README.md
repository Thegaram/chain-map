# Smart Contract Inventory Manager

## Product Design & Implementation Specification

------------------------------------------------------------------------

## Overview

This project is a local-first, single-page web application for tracking
smart contract deployments across multiple chains and versions.\
It runs entirely as a static site and persists state to user-controlled
files. There is no backend or hosted service dependency.

Primary goals:

-   Maintain an organized inventory of deployments
-   Verify and inspect on-chain state
-   Store ABI data and interact with contracts
-   Generate verification guidance bundles
-   Preserve simplicity and aesthetic minimalism

Target scale: **hundreds of records**

------------------------------------------------------------------------

## Architectural Summary

### Application Model

-   Static SPA built with **Svelte**
-   Distributed as compiled HTML/CSS/JS
-   No server components
-   Reads and writes metadata JSON + ABI blob files
-   Queries blockchain RPC endpoints directly

### Storage Model

-   Metadata: `inventory.json`
-   ABI blobs: separate JSON files
-   Files accessed through File System Access API where available
-   Import/export fallback mode otherwise

### Folder Layout

    inventory/
      index.html
      assets/
      data/
        inventory.json
        abis/
          abi_<id>.json

------------------------------------------------------------------------

## UI Design Specification

### Layout Model --- Table-first

    Top Bar
    -----------------------------------
    Search | Filters | Actions

    Main Table
    -----------------------------------
    Scrollable dense contract list

    Drawer (right side)
    -----------------------------------
    Details | On-chain | ABI

### Theme Support

-   Light and Dark mode
-   CSS variable token system
-   Toggle priority:
    1.  User preference
    2.  Stored setting
    3.  System media query

### Visual Goals

-   Minimal chrome
-   Monochrome base palette
-   Sparse iconography
-   No heavy shadows
-   High whitespace ratio
-   Keyboard-first interactions

------------------------------------------------------------------------

## UI Components

### Top Bar

-   Search (fuzzy)
-   Chain filter
-   Type filter
-   Tag filter
-   Add record
-   Import/Export
-   Settings
-   Theme toggle

### Table Columns

  Column     Purpose
  ---------- ----------------------
  Label      Primary identity
  Chain      Deployment chain
  Address    Contract address
  Type       Impl/proxy indicator
  Codehash   Shortened hash
  Source     Repo reference
  Tags       Categorization
  Status     Indicators

### Drawer Tabs

#### Details

Editable metadata fields and notes.

#### On-chain

-   Runtime bytecode inspection
-   Codehash comparison
-   Proxy detection
-   Explorer links

#### ABI / Interact

-   ABI management
-   Read-only function calls

------------------------------------------------------------------------

## Interaction Model

Keyboard shortcuts:

  Action         Key
  -------------- --------------
  Search focus   Ctrl/Cmd + K
  New record     N
  Refresh RPC    R

Row click opens drawer.

------------------------------------------------------------------------

## Data Schema

### inventory.json

Contains:

-   schemaVersion
-   settings
-   chain RPC config
-   contract records

Record fields include:

-   id
-   label
-   address
-   chainId
-   type
-   tags
-   source reference
-   expected codehash
-   ABI linkage
-   verification status
-   notes
-   timestamps

### ABI Blob

Each ABI stored separately:

-   abiId
-   metadata
-   ABI JSON array

------------------------------------------------------------------------

## Runtime State Flows

### Boot

-   Load inventory metadata
-   Apply theme
-   Lazy load ABIs

### Search/Filter

Derived view over records using debounced fuzzy matching.

### Drawer Open

-   Show metadata immediately
-   Load RPC data on On-chain tab activation

### ABI Interaction

-   Generate UI forms from ABI
-   Execute read calls via RPC

### Persistence

Explicit save writes JSON and ABI blobs.

------------------------------------------------------------------------

## On-chain Inspection

### RPC Strategy

-   Global per-chain URL list
-   First healthy endpoint selected
-   Cached health checks

### Codehash

-   Runtime bytecode keccak256

### Proxy Detection

Supported:

-   EIP-1967 storage slot
-   EIP-1167 pattern match

------------------------------------------------------------------------

## Verification Assistance

Mode supported:

-   Instruction bundle generation

Includes:

-   Compiler metadata
-   Repo reference
-   Constructor hints
-   Explorer submission guidance

Direct submission excluded from V1.

------------------------------------------------------------------------

## Component Architecture

    App
     ├ TopBar
     ├ ContractTable
     ├ Drawer
     │  ├ DetailsTab
     │  ├ OnChainTab
     │  └ AbiTab
     ├ StorageManager
     ├ RpcManager
     ├ VerificationHelper
     └ ThemeManager

------------------------------------------------------------------------

## Source Layout

    src/
      components/
      lib/
        stores/
        chain/
        storage/
        verification/
      main.ts

------------------------------------------------------------------------

## Build Stack

-   Vite
-   Svelte
-   ethers library
-   Static bundling output

------------------------------------------------------------------------

## Implementation Roadmap

### Phase 0

Project scaffold and layout skeleton.

### Phase 1

Data schema and inventory store.

### Phase 2

Table UI and filtering.

### Phase 3

File storage integration.

### Phase 4

On-chain inspection features.

### Phase 5

ABI interaction system.

### Phase 6

Verification helper.

------------------------------------------------------------------------

## Non-goals (V1)

-   Wallet signing
-   Transaction submission
-   Multi-user sync
-   IndexedDB persistence
-   Verification API automation

------------------------------------------------------------------------

## Future Extensions

-   Deployment grouping
-   Artifact ingestion
-   Explorer auto-ABI fetch
-   Multi-pane power view
-   API-key based verification submission

------------------------------------------------------------------------

## End of Specification
