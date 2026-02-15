/**
 * Validation utilities
 */

import { VALIDATION, ERROR_MESSAGES } from './constants';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return VALIDATION.ETH_ADDRESS.test(address.trim());
}

/**
 * Validate hex hash format
 */
export function isValidHexHash(hash: string): boolean {
  return VALIDATION.HEX_HASH.test(hash.trim());
}

/**
 * Validate contract form data
 */
export function validateContractForm(data: { label: string; address: string }): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.label.trim()) {
    errors.label = ERROR_MESSAGES.LABEL_REQUIRED;
  }

  if (!data.address.trim()) {
    errors.address = ERROR_MESSAGES.ADDRESS_REQUIRED;
  } else if (!isValidAddress(data.address)) {
    errors.address = ERROR_MESSAGES.ADDRESS_INVALID;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Parse and validate tags from comma-separated string
 */
export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
