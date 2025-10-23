@echo off
echo Fixing component imports...

REM Fix ListNFTModal imports
powershell -Command "(Get-Content 'src/components/betting/BettingPortfolio.tsx') -replace \"from '\./ListNFTModal'\", \"from '../nft/ListNFTModal'\" | Set-Content 'src/components/betting/BettingPortfolio.tsx'"

REM Fix NFTMarketplace imports
powershell -Command "(Get-Content 'src/components/betting/BettingPortfolio.tsx') -replace \"from '\./NFTMarketplace'\", \"from '../nft/NFTMarketplace'\" | Set-Content 'src/components/betting/BettingPortfolio.tsx'"

REM Fix Navigation imports in TopNavigation
powershell -Command "(Get-Content 'src/components/layout/TopNavigation.tsx') -replace \"from '\./Navigation'\", \"from './Navigation'\" | Set-Content 'src/components/layout/TopNavigation.tsx'"

echo Done! Now run: npm run build
