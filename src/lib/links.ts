/**
 * Link generation and formatting utilities
 */

import type { ChainConfig } from './types';

export interface GitHubSource {
  owner: string;
  repo: string;
  ref: string; // commit hash or tag
}

/**
 * Parse GitHub source format: owner/repo@ref or full GitHub URL
 * Examples:
 * - scroll-tech/scroll-contracts@v4.0.0
 * - https://github.com/scroll-tech/scroll-contracts/blob/v4.0.0/src/L1/L1ScrollMessenger.sol
 */
export function parseGitHubSource(source: string): GitHubSource | null {
  // Try parsing as full GitHub URL first
  const urlMatch = source.match(/github\.com\/([^/]+)\/([^/]+)\/(?:blob|tree|commit)\/([^/]+)/);
  if (urlMatch) {
    const [, owner, repo, ref] = urlMatch;
    return { owner, repo, ref };
  }

  // Try parsing as owner/repo@ref format
  const shortMatch = source.match(/^([^/]+)\/([^@]+)@(.+)$/);
  if (shortMatch) {
    const [, owner, repo, ref] = shortMatch;
    return { owner, repo, ref };
  }

  return null;
}

/**
 * Validate GitHub source format
 */
export function isValidGitHubSource(source: string): boolean {
  return parseGitHubSource(source) !== null;
}

/**
 * Format GitHub source for display (shorten to owner/repo@ref)
 * Works with both full URLs and short format
 */
export function formatGitHubSource(source: string): string {
  const parsed = parseGitHubSource(source);
  if (!parsed) return source;

  const { owner, repo, ref } = parsed;

  // If ref looks like a commit hash (40 hex chars), shorten it
  if (/^[a-f0-9]{40}$/i.test(ref)) {
    return `${owner}/${repo}@${ref.slice(0, 7)}`;
  }

  // If ref looks like a 7+ char commit hash, keep it as-is
  if (/^[a-f0-9]{7,}$/i.test(ref)) {
    return `${owner}/${repo}@${ref}`;
  }

  return `${owner}/${repo}@${ref}`;
}

/**
 * Generate GitHub URL from source
 * If source is already a full URL, return it as-is
 * Otherwise generate URL from owner/repo@ref format
 */
export function getGitHubUrl(source: string): string | null {
  // If it's already a GitHub URL, return as-is
  if (source.startsWith('https://github.com/') || source.startsWith('http://github.com/')) {
    return source;
  }

  const parsed = parseGitHubSource(source);
  if (!parsed) return null;

  const { owner, repo, ref } = parsed;

  // If ref looks like a commit hash, link to commit
  if (/^[a-f0-9]{7,40}$/i.test(ref)) {
    return `https://github.com/${owner}/${repo}/commit/${ref}`;
  }

  // Otherwise assume it's a tag
  return `https://github.com/${owner}/${repo}/tree/${ref}`;
}

/**
 * Generate block explorer URL for an address
 */
export function getExplorerAddressUrl(
  address: string,
  chain: ChainConfig | undefined
): string | null {
  if (!chain?.explorerUrl) return null;
  return `${chain.explorerUrl}/address/${address}`;
}

/**
 * Generate block explorer URL for bytecode view
 */
export function getExplorerBytecodeUrl(
  address: string,
  chain: ChainConfig | undefined
): string | null {
  if (!chain?.explorerUrl) return null;
  return `${chain.explorerUrl}/address/${address}#code`;
}
