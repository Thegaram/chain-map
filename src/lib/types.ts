/**
 * Core data types for Chain Map
 */

export type ContractType = 'implementation' | 'proxy';

export interface ContractRecord {
  id: string;
  label: string;
  address: string;
  chainId: number;
  type: ContractType;
  tags: string[];
  source?: string;
  // ABI data
  abi?: any[]; // Contract ABI
  abiSource?: 'explorer' | 'manual'; // Where ABI came from
  abiContractName?: string; // Contract name from explorer
  // Cached on-chain data
  codehash?: string;
  bytecodeSize?: number;
  proxyType?: 'eip1967' | 'eip1167' | 'none';
  implementation?: string;
  // Cached view function results
  viewFunctionCache?: { [key: string]: { value: any; timestamp: number } };
  // Visual hierarchy control
  isCollapsed?: boolean; // For proxies: whether implementations are hidden (defaults to true)
  createdAt: number;
  updatedAt: number;
}

export interface AbiBlob {
  abiId: string;
  contractId: string;
  metadata?: {
    compiler?: string;
    version?: string;
    name?: string;
  };
  abi: any[]; // ABI JSON array
}

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrls: string[];
  explorerUrl?: string;
  explorerApiUrl?: string;
  explorerApiKey?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  lastOpenedFile?: string;
  recentFiles?: string[];
}

export interface InventoryData {
  schemaVersion: number;
  settings: AppSettings;
  chains: ChainConfig[];
  contracts: ContractRecord[];
}

/**
 * Filter state for table view
 */
export interface FilterState {
  searchQuery: string;
  selectedChain: number | 'all';
  selectedType: ContractType | 'all';
  selectedTags: string[];
}

/**
 * Default chain configurations
 *
 * NOTE: Public RPC endpoints often have CORS restrictions when called from browsers.
 * If you encounter CORS errors, you have several options:
 *
 * 1. Use your own RPC endpoint (Alchemy, Infura, QuickNode, etc.)
 * 2. Use a CORS proxy for development (not recommended for production)
 * 3. Run the app with a browser extension that disables CORS (development only)
 *
 * The endpoints below are selected for CORS compatibility, but availability may vary.
 */
export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://cloudflare-eth.com'
    ],
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/v2/api'
  },
  {
    chainId: 534352,
    name: 'Scroll',
    shortName: 'Scroll',
    rpcUrls: [
      'https://scroll-rpc.publicnode.com',
      'https://rpc.scroll.io',
      'https://rpc.ankr.com/scroll'
    ],
    explorerUrl: 'https://scrollscan.com',
    explorerApiUrl: 'https://api.scrollscan.com/api'
  },
  {
    chainId: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    rpcUrls: [
      'https://optimism-rpc.publicnode.com',
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism'
    ],
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api'
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    rpcUrls: [
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum'
    ],
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api'
  },
  {
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    rpcUrls: [
      'https://base-rpc.publicnode.com',
      'https://mainnet.base.org',
      'https://rpc.ankr.com/base'
    ],
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api'
  }
];

/**
 * Default empty inventory structure
 */
export const EMPTY_INVENTORY: InventoryData = {
  schemaVersion: 1,
  settings: {
    theme: 'system'
  },
  chains: DEFAULT_CHAINS,
  contracts: []
};
