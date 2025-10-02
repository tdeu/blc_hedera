import { ethers } from 'ethers';

async function checkAdmin() {
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
  const ADDRESS_TO_CHECK = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  const adminManagerABI = [
    "function isAdmin(address) view returns (bool)",
    "function superAdmin() view returns (address)"
  ];

  const contract = new ethers.Contract(ADMIN_MANAGER_ADDRESS, adminManagerABI, provider);

  console.log('Checking admin status for:', ADDRESS_TO_CHECK);
  console.log('AdminManager contract:', ADMIN_MANAGER_ADDRESS);
  console.log('');

  const isAdmin = await contract.isAdmin(ADDRESS_TO_CHECK);
  const superAdmin = await contract.superAdmin();

  console.log('Is Admin:', isAdmin);
  console.log('Super Admin:', superAdmin);
  console.log('');

  if (isAdmin) {
    console.log('✅ Address IS registered as admin');
  } else {
    console.log('❌ Address is NOT registered as admin');
    console.log('');
    console.log('To add this address as admin, the super admin needs to call:');
    console.log(`adminManager.addAdmin("${ADDRESS_TO_CHECK}")`);
  }
}

checkAdmin().catch(console.error);
