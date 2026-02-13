/**
 * Serialization/deserialization for inventory data
 */

import type { InventoryData, ContractRecord, ChainConfig, AppSettings } from '../types';
import { EMPTY_INVENTORY } from '../types';

/**
 * Serialize inventory data to JSON string
 */
export function serializeInventory(
  contracts: ContractRecord[],
  chains: ChainConfig[],
  settings: AppSettings
): string {
  const data: InventoryData = {
    schemaVersion: 1,
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
      throw new Error('Invalid inventory file: missing schemaVersion');
    }

    if (data.schemaVersion !== 1) {
      throw new Error(`Unsupported schema version: ${data.schemaVersion}`);
    }

    // Validate structure
    if (!Array.isArray(data.contracts)) {
      throw new Error('Invalid inventory file: contracts must be an array');
    }

    if (!Array.isArray(data.chains)) {
      throw new Error('Invalid inventory file: chains must be an array');
    }

    // Validate each contract has required fields
    data.contracts.forEach((contract, index) => {
      if (!contract.id || !contract.label || !contract.address) {
        throw new Error(`Invalid contract at index ${index}: missing required fields`);
      }
    });

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
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
