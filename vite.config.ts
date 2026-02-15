import { defineConfig, Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';

// Get git commit hash
function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

// Plugin to redirect base path without trailing slash to with trailing slash
// Mirrors GitHub Pages behavior in development
function basePathRedirect(): Plugin {
  return {
    name: 'base-path-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Redirect /chain-map to /chain-map/
        if (req.url === '/chain-map') {
          res.writeHead(301, { Location: '/chain-map/' });
          res.end();
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [svelte(), basePathRedirect()],
  base: '/chain-map/',
  build: {
    outDir: 'dist'
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitCommitHash())
  }
});
