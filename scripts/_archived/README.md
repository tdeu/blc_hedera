# Archived Scripts

These scripts were used during development and debugging but are no longer needed.
The working solution is in `deploy-working-factory.js` which deploys `PredictionMarketFactoryFixed.sol`.

## Issue Summary
The original factory contracts failed because they tried to call `betNFT.authorizeMarket()`
from within the factory contract, but only the BetNFT owner can call that function.

The fixed factory removes this problematic call, allowing markets to be created successfully.