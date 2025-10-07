import { ethers } from 'ethers';

// Market contract address from your error logs
const MARKET_CONTRACT = '0x6f517004FAce006cb4B137a6702cD5Efa8cA392b';

const MARKET_ABI = [
  "function getMarketState() external view returns (uint8)",
  "function creationTime() external view returns (uint256)",
  "function endTime() external view returns (uint256)",
  "function resolutionTime() external view returns (uint256)",
  "function disputePeriodEnd() external view returns (uint256)",
  "function resolved() external view returns (bool)",
  "function outcome() external view returns (bool)",
  "function question() external view returns (string)",
];

async function checkMarketTimeline() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const contract = new ethers.Contract(MARKET_CONTRACT, MARKET_ABI, provider);

  console.log('\n📊 MARKET TIMELINE FOR:', MARKET_CONTRACT);
  console.log('='.repeat(80));

  try {
    // Try to get market state
    try {
      const state = await contract.getMarketState();
      const states = ['Active', 'Expired', 'Resolved', 'Disputable', 'Finalized'];
      console.log('\n🏛️  Market State:', states[state] || `Unknown (${state})`);
    } catch (e) {
      console.log('\n⚠️  Could not get market state (function may not exist)');
    }

    // Try to get timestamps
    const now = Math.floor(Date.now() / 1000);

    try {
      const creationTime = await contract.creationTime();
      const creationDate = new Date(Number(creationTime) * 1000);
      console.log('\n📅 Created:', creationDate.toLocaleString());
      console.log('   ↳', Math.floor((now - Number(creationTime)) / 86400), 'days ago');
    } catch (e) {
      console.log('\n⚠️  Creation time not available');
    }

    try {
      const endTime = await contract.endTime();
      const endDate = new Date(Number(endTime) * 1000);
      const daysUntilEnd = Math.floor((Number(endTime) - now) / 86400);
      console.log('\n⏰ Market Ends:', endDate.toLocaleString());
      if (daysUntilEnd > 0) {
        console.log('   ↳ In', daysUntilEnd, 'days');
      } else {
        console.log('   ↳', Math.abs(daysUntilEnd), 'days ago (EXPIRED ❌)');
      }
    } catch (e) {
      console.log('\n⚠️  End time not available');
    }

    try {
      const resolutionTime = await contract.resolutionTime();
      if (Number(resolutionTime) > 0) {
        const resolutionDate = new Date(Number(resolutionTime) * 1000);
        console.log('\n🤖 AI Resolved:', resolutionDate.toLocaleString());
        console.log('   ↳', Math.floor((now - Number(resolutionTime)) / 86400), 'days ago');
      } else {
        console.log('\n🤖 AI Resolution: Not resolved yet');
      }
    } catch (e) {
      console.log('\n⚠️  Resolution time not available');
    }

    try {
      const disputePeriodEnd = await contract.disputePeriodEnd();
      if (Number(disputePeriodEnd) > 0) {
        const disputeEndDate = new Date(Number(disputePeriodEnd) * 1000);
        const hoursUntilDisputeEnd = Math.floor((Number(disputePeriodEnd) - now) / 3600);
        console.log('\n⚖️  Dispute Period Ends:', disputeEndDate.toLocaleString());
        if (hoursUntilDisputeEnd > 0) {
          console.log('   ↳ In', hoursUntilDisputeEnd, 'hours ✅ (CAN DISPUTE)');
        } else {
          console.log('   ↳', Math.abs(hoursUntilDisputeEnd), 'hours ago ❌ (CANNOT DISPUTE - EXPIRED)');
        }
      } else {
        console.log('\n⚖️  Dispute Period: Not started yet');
      }
    } catch (e) {
      console.log('\n⚠️  Dispute period end not available');
    }

    try {
      const resolved = await contract.resolved();
      const outcome = await contract.outcome();
      console.log('\n✅ Final Resolution:', resolved ? (outcome ? 'YES' : 'NO') : 'Not finalized');
    } catch (e) {
      console.log('\n⚠️  Resolution status not available');
    }

    try {
      const question = await contract.question();
      console.log('\n❓ Question:', question);
    } catch (e) {
      // Question might not be available
    }

  } catch (error: any) {
    console.error('\n❌ Error reading contract:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Summary:');
  console.log('If "Dispute Period Ends" shows hours AGO (negative), you CANNOT dispute.');
  console.log('The contract rejects disputes after the dispute period expires.\n');
}

checkMarketTimeline();
