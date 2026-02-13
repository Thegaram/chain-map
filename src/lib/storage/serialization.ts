/**
 * Serialization/deserialization for inventory data
 */

import type { InventoryData, ContractRecord, ChainConfig, AppSettings } from '../types';
import { EMPTY_INVENTORY } from '../types';
import { FILE_CONFIG, ERROR_MESSAGES } from '../constants';

/**
 * Serialize inventory data to JSON string
 */
export function serializeInventory(
  contracts: ContractRecord[],
  chains: ChainConfig[],
  settings: AppSettings
): string {
  const data: InventoryData = {
    schemaVersion: FILE_CONFIG.SCHEMA_VERSION,
    settings,
    chains,
    contracts
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Deserialize JSON string to inventory data
 */
export function deserializeInventory(json: string): InventoryData {
  try {
    const data = JSON.parse(json) as InventoryData;

    // Validate schema
    if (!data.schemaVersion) {
      throw new Error(ERROR_MESSAGES.MISSING_SCHEMA);
    }

    if (data.schemaVersion !== FILE_CONFIG.SCHEMA_VERSION) {
      throw new Error(ERROR_MESSAGES.UNSUPPORTED_SCHEMA(data.schemaVersion));
    }

    // Validate structure
    if (!Array.isArray(data.contracts)) {
      throw new Error(ERROR_MESSAGES.INVALID_CONTRACTS);
    }

    if (!Array.isArray(data.chains)) {
      throw new Error(ERROR_MESSAGES.INVALID_CHAINS);
    }

    // Validate each contract has required fields
    data.contracts.forEach((contract, index) => {
      if (!contract.id || !contract.label || !contract.address) {
        throw new Error(ERROR_MESSAGES.INVALID_CONTRACT(index));
      }
    });

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(ERROR_MESSAGES.INVALID_JSON);
    }
    throw error;
  }
}

/**
 * Create an empty inventory file content
 */
export function createEmptyInventory(): string {
  return serializeInventory(
    EMPTY_INVENTORY.contracts,
    EMPTY_INVENTORY.chains,
    EMPTY_INVENTORY.settings
  );
}
