/**
 * Check Market's Factory Address
 * Verifies which factory a market contract is pointing to
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const MARKET_ABI = [
  'function factory() view returns (address)',
  'function getMarketInfo() view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))',
];

const CAST_TOKEN_ABI = [
  'function authorizedMinters(address) view returns (bool)',
];

async function checkMarketFactory() {
  console.log(`\n🔍 CHECK MARKET'S FACTORY CONFIGURATION`);
  console.log(`=`.repeat(80));

  try {
    // Market address from the error log - King Albert market
    const marketAddress = '0x3e004AaB201E8a3cfaC9906c9ded192360dbdFA7';
    const expectedFactoryAddress = process.env.CONTRACT_PREDICTION_MARKET_FACTORY!;
    const castTokenAddress = process.env.CONTRACT_CAST_TOKEN!;

    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const market = new ethers.Contract(marketAddress, MARKET_ABI, provider);
    const castToken = new ethers.Contract(castTokenAddress, CAST_TOKEN_ABI, provider);

    console.log(`\n📋 Addresses:`);
    console.log(`   Market: ${marketAddress}`);
    console.log(`   Expected Factory (from .env): ${expectedFactoryAddress}`);
    console.log(`   CastToken: ${castTokenAddress}`);

    // Get actual factory from market
    console.log(`\n🏭 Step 1: Get Market's Factory Address`);
    const actualFactory = await market.factory();
    console.log(`   Actual Factory (from market): ${actualFactory}`);
    console.log(`   Matches expected: ${actualFactory.toLowerCase() === expectedFactoryAddress.toLowerCase() ? '✅ YES' : '❌ NO'}`);

    // Check if actual factory is authorized
    console.log(`\n🔐 Step 2: Check Actual Factory Authorization`);
    const isAuthorized = await castToken.authorizedMinters(actualFactory);
    console.log(`   Actual factory is authorized: ${isAuthorized ? '✅ YES' : '❌ NO'}`);

    // Check if expected factory is authorized
    console.log(`\n🔐 Step 3: Check Expected Factory Authorization`);
    const expectedIsAuthorized = await castToken.authorizedMinters(expectedFactoryAddress);
    console.log(`   Expected factory is authorized: ${expectedIsAuthorized ? '✅ YES' : '❌ NO'}`);

    // Get market info
    console.log(`\n📊 Step 4: Get Market Info`);
    try {
      const marketInfo = await market.getMarketInfo();
      console.log(`   Question: ${marketInfo.question}`);
      console.log(`   Status: ${marketInfo.status}`);
    } catch (e) {
      console.log(`   Could not fetch market info`);
    }

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`=`.repeat(80));

    if (actualFactory.toLowerCase() !== expectedFactoryAddress.toLowerCase()) {
      console.log(`\n❌ PROBLEM: Market is using a DIFFERENT factory!`);
      console.log(`\n   Market's factory: ${actualFactory}`);
      console.log(`   .env factory: ${expectedFactoryAddress}`);
      console.log(`\n🔧 FIX: Authorize the ACTUAL factory as a minter:`);
      console.log(`   npx tsx scripts/authorize-specific-factory.ts ${actualFactory}`);
    } else if (!isAuthorized) {
      console.log(`\n❌ PROBLEM: Factory is NOT authorized!`);
      console.log(`\n🔧 FIX: Run npx tsx scripts/authorize-factory-minter.ts`);
    } else {
      console.log(`\n✅ Factory configuration is correct!`);
      console.log(`\n🤔 The issue might be elsewhere. Check:`);
      console.log(`   1. Gas limits`);
      console.log(`   2. Contract deployment`);
      console.log(`   3. Network connectivity`);
    }

  } catch (error: any) {
    console.error(`\n❌ ERROR:`, error.message);
    if (error.info) {
      console.error(`   Info:`, error.info);
    }
    console.error(`\nFull error:`, error);
  }
}

checkMarketFactory();
