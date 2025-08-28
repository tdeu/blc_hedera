# Blockcast Production Deployment Guide

## Option 1: Vercel (Recommended for React)
```bash
npm install -g vercel
vercel --prod
```
Add environment variables in Vercel dashboard.

## Option 2: Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```
Add environment variables in Netlify settings.

## Option 3: Traditional Hosting
```bash
npm run build
# Upload dist/ folder to your web server
```

## Environment Variables for Production
- Add your Hedera MAINNET credentials
- Set NODE_ENV=production
- Keep private keys secure (never in git)

## Domain Setup for Africa
- Consider .africa or country-specific domains
- Optimize for mobile networks
- Enable HTTPS (required for blockchain features)

Your app will work perfectly with your existing UI while providing bulletproof blockchain infrastructure.