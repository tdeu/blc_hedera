async function main() {
    const { ethers } = await import("ethers");

    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const txHash = '0xaa57d5b8c31005c4ed98e22ce469d862859dc7d54f93af90230dbbad721cf418';

    console.log(`🔍 Checking transaction: ${txHash}`);

    try {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        console.log('\n📋 Transaction Details:');
        console.log('  Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
        console.log('  To:', tx.to);
        console.log('  Value:', ethers.formatEther(tx.value), 'ETH');
        console.log('  Gas Used:', receipt.gasUsed.toString());
        console.log('  Gas Limit:', tx.gasLimit.toString());

        console.log('\n🏷️  Events:');
        receipt.logs.forEach((log, i) => {
            console.log(`  Log ${i}:`);
            console.log('    Address:', log.address);
            console.log('    Topics:', log.topics);
            console.log('    Data:', log.data);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);