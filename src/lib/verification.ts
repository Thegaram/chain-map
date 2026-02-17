/**
 * Verification instruction generation
 */

import type { ContractRecord, ChainConfig, VerificationTemplate } from './types';
import { VERIFICATION_TEMPLATES } from './verificationTemplates';

interface GitHubSource {
  owner: string;
  repo: string;
  ref: string;
  path?: string;
}

/**
 * Parse GitHub source URL or shorthand
 * Supports:
 * - owner/repo@ref
 * - https://github.com/owner/repo/blob/ref/path/to/Contract.sol
 * - https://github.com/owner/repo/tree/ref/path/to/Contract.sol
 */
export function parseGitHubSource(source: string): GitHubSource | null {
  if (!source) return null;

  // Shorthand: owner/repo@ref or owner/repo@ref/path/to/Contract.sol
  const shorthandMatch = source.match(/^([^/]+)\/([^@]+)@([^/]+)(?:\/(.+))?$/);
  if (shorthandMatch) {
    return {
      owner: shorthandMatch[1],
      repo: shorthandMatch[2],
      ref: shorthandMatch[3],
      path: shorthandMatch[4]
    };
  }

  // Full URL: https://github.com/owner/repo/blob/ref/path/to/Contract.sol
  const urlMatch = source.match(/github\.com\/([^/]+)\/([^/]+)\/(?:blob|tree)\/([^/]+)(?:\/(.+))?/);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      ref: urlMatch[3],
      path: urlMatch[4]
    };
  }

  return null;
}

/**
 * Find matching template for a contract
 * Returns the most specific match (checks patterns in order)
 */
export function findTemplate(contract: ContractRecord): VerificationTemplate | null {
  if (!contract.source) return null;

  const githubSource = parseGitHubSource(contract.source);
  if (!githubSource) return null;

  const repoFullName = `${githubSource.owner}/${githubSource.repo}`;

  // Find first matching template
  for (const template of VERIFICATION_TEMPLATES) {
    const pattern = new RegExp(template.repoPattern);
    if (pattern.test(repoFullName)) {
      return template;
    }
  }

  return null;
}

/**
 * Extract contract name from source path or label
 */
export function extractContractName(contract: ContractRecord): string {
  // Try to extract from source path first
  if (contract.source) {
    const githubSource = parseGitHubSource(contract.source);
    if (githubSource?.path) {
      // Get filename without extension: "src/L1ScrollMessenger.sol" -> "L1ScrollMessenger"
      const filename = githubSource.path.split('/').pop();
      return filename?.replace(/\.sol$/, '') || contract.label;
    }
  }

  // Fall back to label (user might have named it after the contract)
  return contract.label;
}

interface TemplateVariables {
  address: string;
  chainId: string;
  chainName: string;
  rpcUrl: string;
  owner: string;
  repo: string;
  ref: string;
  contractPath: string;
  contractName: string;
  label: string;
  codehash: string;
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: VerificationTemplate,
  contract: ContractRecord,
  chain: ChainConfig
): string {
  const githubSource = parseGitHubSource(contract.source || '');
  if (!githubSource) return template.instructions;

  const variables: TemplateVariables = {
    address: contract.address,
    chainId: chain.chainId.toString(),
    chainName: chain.name,
    rpcUrl: chain.rpcUrls[0] || '',
    owner: githubSource.owner,
    repo: githubSource.repo,
    ref: githubSource.ref,
    contractPath: githubSource.path || '',
    contractName: extractContractName(contract),
    label: contract.label,
    codehash: contract.codehash || 'Not fetched yet - run "Fetch Codehash" first'
  };

  let result = template.instructions;

  // Replace all {{variable}} occurrences
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  // Handle conditional sections: {{#codehash}}...{{/codehash}}
  // Remove section if variable is empty/falsy
  result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, varName, content) => {
    const value = variables[varName as keyof TemplateVariables];
    return value && !value.startsWith('Not fetched') ? content : '';
  });

  return result;
}

/**
 * Generate verification instructions for a contract
 */
export function generateVerificationInstructions(
  contract: ContractRecord,
  chain: ChainConfig
): string | null {
  const template = findTemplate(contract);
  if (!template) return null;

  return renderTemplate(template, contract, chain);
}
