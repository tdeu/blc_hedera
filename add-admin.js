import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function addAdmin() {
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
  const NEW_ADMIN_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';

  // Get private key from environment
  const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM;

  if (!privateKey) {
    console.error('❌ VITE_HEDERA_PRIVATE_KEY_EVM not found in .env file');
    console.error('This should be the super admin private key');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Super Admin Wallet:', wallet.address);
  console.log('AdminManager Contract:', ADMIN_MANAGER_ADDRESS);
  console.log('Adding Admin:', NEW_ADMIN_ADDRESS);
  console.log('');

  const adminManagerABI = [
    "function isAdmin(address) view returns (bool)",
    "function superAdmin() view returns (address)",
    "function addAdmin(address _admin) external"
  ];

  const contract = new ethers.Contract(ADMIN_MANAGER_ADDRESS, adminManagerABI, wallet);

  // Verify we're the super admin
  const superAdmin = await contract.superAdmin();
  if (superAdmin.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error('❌ ERROR: Connected wallet is not the super admin!');
    console.error('Super Admin:', superAdmin);
    console.error('Your Wallet:', wallet.address);
    process.exit(1);
  }

  console.log('✅ Verified: You are the super admin');
  console.log('');

  // Check if already admin
  const isAlreadyAdmin = await contract.isAdmin(NEW_ADMIN_ADDRESS);
  if (isAlreadyAdmin) {
    console.log('✅ Address is already an admin!');
    process.exit(0);
  }

  console.log('📤 Sending transaction to add admin...');
  const tx = await contract.addAdmin(NEW_ADMIN_ADDRESS);

  console.log('⏳ Transaction sent:', tx.hash);
  console.log('⏳ Waiting for confirmation...');

  const receipt = await tx.wait();

  console.log('✅ Transaction confirmed!');
  console.log('🔗 Transaction hash:', receipt.hash);
  console.log('');

  // Verify it worked
  const isNowAdmin = await contract.isAdmin(NEW_ADMIN_ADDRESS);
  if (isNowAdmin) {
    console.log('✅ SUCCESS! Address is now registered as admin');
  } else {
    console.log('❌ Something went wrong - address is still not admin');
  }
}

addAdmin().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
