import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Deploying DisputeManager contract...');

  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log('Deploying with account:', signer.address);

  const balance = await provider.getBalance(signer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'HBAR');

  // Get AdminManager address from env (lowercase for Hedera)
  const adminManagerAddress = '0x18ae8c6bc5ed1bedc6da3f2d6df36d87beb48b37'; // From constants.ts
  const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2'; // CORRECT CAST token address

  console.log('AdminManager address:', adminManagerAddress);
  console.log('CAST Token address:', castTokenAddress);

  // Load contract artifact
  const DisputeManagerArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/DisputeManager.sol/DisputeManager.json', 'utf8')
  );

  // Deploy DisputeManager
  console.log('\nDeploying DisputeManager...');
  const DisputeManagerFactory = new ethers.ContractFactory(
    DisputeManagerArtifact.abi,
    DisputeManagerArtifact.bytecode,
    signer
  );
  const disputeManager = await DisputeManagerFactory.deploy(adminManagerAddress, castTokenAddress);
  await disputeManager.waitForDeployment();
  const deployedAddress = await disputeManager.getAddress();

  console.log('✅ DisputeManager deployed to:', deployedAddress);
  console.log('\n📋 Update this address in src/config/constants.ts:');
  console.log(`DISPUTE_MANAGER_CONTRACT: '${deployedAddress}',`);

  // Verify bond amount
  const bondAmount = await disputeManager.DISPUTE_BOND_AMOUNT();
  console.log('\n💰 Dispute Bond Amount:', ethers.formatEther(bondAmount), 'CAST');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });