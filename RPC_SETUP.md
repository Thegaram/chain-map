# RPC Setup Guide

Chain Map is a **local-first, browser-based application** that makes direct RPC calls to blockchain networks. This means it faces some limitations when using public RPC endpoints.

## The CORS Problem

When you see errors like:
- `CORS policy: No 'Access-Control-Allow-Origin' header`
- `Failed to fetch`
- `Network request failed`

This is because **most public RPC endpoints don't allow direct requests from web browsers** for security and abuse prevention reasons.

## Solutions

### Option 1: Use Your Own RPC Provider (Recommended)

Get a free RPC endpoint from one of these providers:

1. **[Alchemy](https://www.alchemy.com/)** - Free tier: 300M compute units/month
2. **[Infura](https://www.infura.io/)** - Free tier: 100k requests/day
3. **[QuickNode](https://www.quicknode.com/)** - Free tier available
4. **[Ankr](https://www.ankr.com/rpc/)** - Free public endpoints (may have rate limits)

**How to configure:**
1. Sign up and get your RPC URL
2. In Chain Map: Open the Actions menu (⋮) → Settings
3. Edit your chain configuration
4. Replace the RPC URL with your custom endpoint
5. Save and reload

Example custom RPC URL:
```
https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Option 2: CORS Proxy (Development Only)

⚠️ **Not recommended for production use** - Only use for local development/testing.

You can use a CORS proxy to forward requests:

1. **Local CORS Proxy:**
   ```bash
   npx cors-anywhere
   ```
   Then prefix your RPC URLs with `http://localhost:8080/`

2. **Browser Extension:**
   - Chrome: [Allow CORS: Access-Control-Allow-Origin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
   - Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

   ⚠️ **Security Warning**: Disable these extensions after testing!

### Option 3: Use CORS-Friendly Public RPCs

Chain Map includes some CORS-friendly public endpoints by default:
- PublicNode (ethereum-rpc.publicnode.com, etc.)
- Ankr (rpc.ankr.com)
- Cloudflare Ethereum (cloudflare-eth.com)

However, these may have rate limits or occasional downtime.

## Retry Logic & Fallbacks

Chain Map automatically:
- ✓ Retries failed requests with exponential backoff
- ✓ Falls back to alternate RPC URLs if configured
- ✓ Rate limits requests to prevent overwhelming endpoints (100ms between requests)

If you configure multiple RPC URLs for a chain, the app will automatically try each one until one succeeds.

## Rate Limiting

Public RPC endpoints often have rate limits:
- **Alchemy Free**: 300M compute units/month
- **Infura Free**: 100k requests/day
- **Public nodes**: Varies, typically 100-500 requests/minute

Chain Map includes built-in rate limiting to help stay within these limits, but for heavy usage, consider upgrading to a paid plan.

## Best Practices

1. **Use dedicated RPC endpoints** for production use
2. **Configure multiple RPC URLs** as fallbacks
3. **Monitor your usage** if using free tier providers
4. **Don't commit API keys** to version control (use `.gitignore`)
5. **Rotate keys** if accidentally exposed

## Troubleshooting

**Still getting CORS errors after configuring custom RPC?**
- Check that your RPC provider supports CORS
- Verify your API key is correct
- Try a different RPC provider

**Requests timing out?**
- Public endpoints may be congested
- Try a different RPC URL
- Use a dedicated provider

**Rate limit errors?**
- Wait a few minutes
- Upgrade to a paid plan
- Use a different provider

## Example Configuration

Here's an example chain configuration with multiple fallback RPCs:

```json
{
  "chainId": 1,
  "name": "Ethereum Mainnet",
  "shortName": "Ethereum",
  "rpcUrls": [
    "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    "https://ethereum-rpc.publicnode.com"
  ],
  "explorerUrl": "https://etherscan.io",
  "explorerApiUrl": "https://api.etherscan.io/v2/api"
}
```

The app will try the first URL, then fall back to the second if it fails, and so on.
