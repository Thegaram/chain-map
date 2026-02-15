import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { execSync } from 'child_process'

// Get git commit hash
function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch (error) {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist'
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitCommitHash())
  }
})
