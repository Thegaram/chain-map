/**
 * Core data types for Contract Inventory
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
  abiId?: string;
  // Cached on-chain data
  codehash?: string;
  bytecodeSize?: number;
  proxyType?: 'eip1967' | 'eip1167' | 'none';
  implementation?: string;
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
 */
export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    rpcUrls: ['https://eth.llamarpc.com'],
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api'
  },
  {
    chainId: 534352,
    name: 'Scroll',
    shortName: 'Scroll',
    rpcUrls: ['https://rpc.scroll.io'],
    explorerUrl: 'https://scrollscan.com',
    explorerApiUrl: 'https://api.scrollscan.com/api'
  },
  {
    chainId: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    rpcUrls: ['https://mainnet.optimism.io'],
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api'
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api'
  },
  {
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
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
