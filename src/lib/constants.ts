/**
 * Application constants
 */

// File configuration
export const FILE_CONFIG = {
  DEFAULT_NAME: 'inventory.json',
  SCHEMA_VERSION: 1,
  FILE_TYPES: [
    {
      description: 'JSON Files',
      accept: { 'application/json': ['.json'] }
    }
  ]
} as const;

// Database configuration
export const DB_CONFIG = {
  NAME: 'chain-map-db',
  STORE_NAME: 'file-handles',
  HANDLE_KEY: 'current-file-handle',
  URL_KEY: 'source-url',
  URL_TIMESTAMP_KEY: 'source-url-timestamp'
} as const;

// Validation patterns
export const VALIDATION = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  HEX_HASH: /^0x[a-fA-F0-9]+$/
} as const;

// Validation error messages
export const ERROR_MESSAGES = {
  LABEL_REQUIRED: 'Label is required',
  ADDRESS_REQUIRED: 'Address is required',
  ADDRESS_INVALID: 'Invalid Ethereum address format',
  CODEHASH_INVALID: 'Invalid codehash format (must start with 0x)',
  INVALID_JSON: 'Invalid JSON format',
  MISSING_SCHEMA: 'Invalid inventory file: missing schemaVersion',
  UNSUPPORTED_SCHEMA: (version: number) => `Unsupported schema version: ${version}`,
  INVALID_CONTRACTS: 'Invalid inventory file: contracts must be an array',
  INVALID_CHAINS: 'Invalid inventory file: chains must be an array',
  INVALID_CONTRACT: (index: number) =>
    `Invalid contract at index ${index}: missing required fields`,
  PERMISSION_DENIED: 'Permission denied',
  READ_PERMISSION_DENIED: 'Read permission denied',
  WRITE_PERMISSION_DENIED: 'Write permission denied'
} as const;

// UI messages
export const UI_MESSAGES = {
  UNSAVED_CHANGES: 'You have unsaved changes. Create new inventory anyway?',
  DELETE_CONFIRM: (label: string) => `Are you sure you want to delete "${label}"?`,
  SAVE_SUCCESS: 'Contract updated successfully',
  FALLBACK_MODE: 'Using download/upload fallback'
} as const;

// Keyboard shortcuts
export const SHORTCUTS = {
  SEARCH: 'k',
  NEW: 'n',
  SAVE: 's',
  OPEN: 'o',
  REFRESH: 'r',
  HELP: '?'
} as const;

// Contract status icons
export const STATUS_ICONS = {
  VERIFIED: '✓',
  UNVERIFIED: '?',
  PENDING: '⋯',
  FAILED: '✗'
} as const;

// Theme icons
export const THEME_ICONS = {
  LIGHT: '◐',
  DARK: '◑'
} as const;

// 3rd-party inventory examples for URL loading
export interface InventoryExample {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export const INVENTORY_EXAMPLES: InventoryExample[] = [
  {
    id: 'scroll-core',
    name: 'Scroll Core Contracts',
    description:
      'Essential Scroll L2 infrastructure contracts including bridges and messengers on Ethereum and Scroll',
    url: '/examples/scroll-core.json',
    tags: ['Scroll', 'L2', 'Bridge', 'Infrastructure']
  }
];

// Read-only mode messages
export const READ_ONLY_MESSAGES = {
  CANNOT_SAVE: 'Cannot save to URL. Use Save As to create a local copy.',
  LOADED_FROM_URL: 'Inventory loaded from URL (read-only mode)',
  SAVE_AS_TO_EDIT: 'Changes will be lost on reload. Use Save As to create an editable local copy.'
} as const;
