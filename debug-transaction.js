import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function debugTransaction() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  // The failed transaction
  const txHash = '0x88c9134347217baa4c7fb744dc38d1b1399ff1661a7f3e832faf618b7d6bc759';

  console.log('🔍 Investigating transaction:', txHash);

  try {
    const tx = await provider.getTransaction(txHash);
    console.log('📄 Transaction details:', {
      hash: tx.hash,
      to: tx.to,
      value: tx.value?.toString(),
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString()
    });

    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('📋 Transaction receipt:', {
      status: receipt.status,
      gasUsed: receipt.gasUsed?.toString(),
      logs: receipt.logs.length
    });

    if (receipt.status === 0) {
      console.log('❌ Transaction FAILED on blockchain');
      console.log('This is why your bet didn\'t work!');
    } else {
      console.log('✅ Transaction succeeded');
    }

  } catch (error) {
    console.error('❌ Error fetching transaction:', error.message);
  }
}

debugTransaction().catch(console.error);