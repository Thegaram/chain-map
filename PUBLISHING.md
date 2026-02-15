# Publishing Checklist

## ✅ Completed

- [x] Project renamed to "Chain Map"
- [x] Clean, concise README with CI badge
- [x] GitHub Actions CI workflow (linting on PRs and pushes to main)
- [x] GitHub Actions deployment workflow (separate file)
- [x] Vite base path configured for GitHub Pages (`/chain-map/`)
- [x] Meta tags added for SEO and social sharing
- [x] Favicon configured
- [x] TypeScript, ESLint, and Prettier configured
- [x] Build scripts ready (`npm run build`)
- [x] Example inventory with proper URLs (relative paths work with base)

## 📋 Before First Deployment

1. **Create GitHub repository**
   - Repository name: `chain-map`
   - Update README badge URLs with your GitHub username

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: GitHub Actions

3. **Update README badge**
   - Replace `USERNAME` with your GitHub username in README.md

4. **First push**
   ```bash
   git add -A
   git commit -m "Setup project for GitHub Pages deployment"
   git remote add origin git@github.com:thegaram/chain-map.git
   git push -u origin main
   ```

5. **Verify deployment**
   - Check Actions tab for workflow runs
   - Visit: `https://thegaram.github.io/chain-map/`

## 🔧 Configuration Details

- **Base URL**: `/chain-map/` (configured in `vite.config.ts`)
- **Deploy on**: Push to `main` branch
- **Build output**: `dist/` directory
- **Node version**: 20

## 📝 Notes

- TypeCheck has `continue-on-error: true` due to pre-existing TypeScript errors
- Lint passes with warnings only (0 errors)
- Example inventory uses relative URLs that work with base path
