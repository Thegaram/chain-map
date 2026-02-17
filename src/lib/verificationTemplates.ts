/**
 * Verification instruction templates for different repositories
 */

import type { VerificationTemplate } from './types';

export const VERIFICATION_TEMPLATES: VerificationTemplate[] = [
  {
    id: 'scroll-contracts',
    name: 'Scroll Contracts (Foundry)',
    repoPattern: '^scroll-tech/scroll-contracts$',
    buildTool: 'foundry',
    instructions: `# Verification: {{label}}

**Address:** \`{{address}}\` on {{chainName}}
**Repository:** https://github.com/{{owner}}/{{repo}} @ \`{{ref}}\`
{{#codehash}}**Expected Codehash:** \`{{codehash}}\`{{/codehash}}

## Steps

### 1. Setup
\`\`\`bash
git clone https://github.com/{{owner}}/{{repo}}.git
cd {{repo}}
git checkout {{ref}}
forge install
forge build
export RPC_URL="{{rpcUrl}}"
\`\`\`

### 2. Find Constructor Arguments
\`\`\`bash
# Get deployment transaction (find tx hash on explorer)
cast tx <DEPLOYMENT_TX_HASH> --rpc-url $RPC_URL

# Constructor args are appended to bytecode in tx input data
# Decode based on constructor signature (check contract source)
\`\`\`

### 3. Simulate Deployment
\`\`\`bash
# Fork at deployment block
anvil --fork-url $RPC_URL --fork-block-number <DEPLOYMENT_BLOCK> &

# Deploy with exact constructor args
forge create src/{{contractPath}}:{{contractName}} \\
  --constructor-args <arg1> <arg2> ... \\
  --rpc-url http://localhost:8545 \\
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
\`\`\`

### 4. Compare Bytecode
\`\`\`bash
# Get both bytecodes
cast code <SIMULATED_ADDR> --rpc-url http://localhost:8545 > simulated.hex
cast code {{address}} --rpc-url $RPC_URL > deployed.hex

# Compare
if diff deployed.hex simulated.hex; then
  echo "✓ Bytecode matches"
else
  echo "✗ Bytecode mismatch"
fi
\`\`\`

{{#codehash}}
**Verify codehash:**
\`\`\`bash
ACTUAL=$(cast keccak $(cast code {{address}} --rpc-url $RPC_URL))
echo "Expected: {{codehash}}"
echo "Actual:   $ACTUAL"
\`\`\`
{{/codehash}}

## Notes

- Constructor args required for contracts with immutable variables
- Check deployment scripts in repo for constructor values
- Bytecode must match exactly (including metadata hash)
`
  }
];
