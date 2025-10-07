import { ethers } from 'ethers';

// Market contract address from your error logs
const MARKET_CONTRACT = '0x6f517004FAce006cb4B137a6702cD5Efa8cA392b';

const MARKET_ABI = [
  "function getMarketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))",
  "function isPendingResolution() external view returns (bool)",
  "function preliminaryResolveTime() external view returns (uint256)",
  "function resolvedOutcome() external view returns (uint8)",
  "function preliminaryOutcome() external view returns (uint8)",
  "function confidenceScore() external view returns (uint256)",
];

async function checkMarketStatus() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const contract = new ethers.Contract(MARKET_CONTRACT, MARKET_ABI, provider);

  console.log('\n📊 MARKET STATUS CHECK');
  console.log('='.repeat(80));
  console.log('Market:', MARKET_CONTRACT);
  console.log('='.repeat(80));

  try {
    // Get market info
    const marketInfo = await contract.getMarketInfo();
    const statuses = ['Submited', 'Open', 'PendingResolution', 'Resolved', 'Canceled'];

    console.log('\n📋 Market Info:');
    console.log('  Question:', marketInfo.question);
    console.log('  Creator:', marketInfo.creator);
    console.log('  End Time:', new Date(Number(marketInfo.endTime) * 1000).toLocaleString());
    console.log('  Status:', statuses[marketInfo.status], `(${marketInfo.status})`);

    // Check if pending resolution
    const isPending = await contract.isPendingResolution();
    console.log('\n⚖️  Is Pending Resolution?', isPending ? 'YES ✅' : 'NO ❌');

    if (!isPending) {
      console.log('   ↳ This means the market is NOT disputable anymore');
    }

    // Get preliminary resolve time
    try {
      const prelimTime = await contract.preliminaryResolveTime();
      if (Number(prelimTime) > 0) {
        const prelimDate = new Date(Number(prelimTime) * 1000);
        console.log('\n🤖 Preliminary Resolution Time:', prelimDate.toLocaleString());

        // Calculate when dispute period would have ended (168 hours = 7 days)
        const disputeEndTime = Number(prelimTime) + (168 * 3600);
        const disputeEndDate = new Date(disputeEndTime * 1000);
        console.log('⏰ Dispute Period Would End:', disputeEndDate.toLocaleString());

        const now = Math.floor(Date.now() / 1000);
        if (now > disputeEndTime) {
          const hoursAgo = Math.floor((now - disputeEndTime) / 3600);
          console.log(`   ↳ Dispute period ended ${hoursAgo} hours ago ❌`);
        }
      }
    } catch (e) {
      console.log('\n⚠️  Could not get preliminary resolve time');
    }

    // Get outcomes
    try {
      const prelimOutcome = await contract.preliminaryOutcome();
      const resolvedOutcome = await contract.resolvedOutcome();
      const outcomes = ['Unset', 'Yes', 'No'];

      console.log('\n✅ Outcomes:');
      console.log('  Preliminary:', outcomes[prelimOutcome]);
      console.log('  Final:', outcomes[resolvedOutcome]);
    } catch (e) {
      console.log('\n⚠️  Could not get outcomes');
    }

    // Get confidence score
    try {
      const confidence = await contract.confidenceScore();
      if (Number(confidence) > 0) {
        console.log('  AI Confidence:', confidence.toString() + '%');
      }
    } catch (e) {
      // Confidence not available
    }

    // Now check blockchain events to find WHEN it was finalized
    console.log('\n\n🔍 SEARCHING BLOCKCHAIN EVENTS...');
    console.log('='.repeat(80));

    const EVENTS_ABI = [
      "event PreliminaryResolution(uint8 outcome, uint256 timestamp)",
      "event FinalResolution(uint8 outcome, uint256 confidenceScore, uint256 timestamp)"
    ];

    const eventContract = new ethers.Contract(MARKET_CONTRACT, EVENTS_ABI, provider);

    // Get all events from contract creation
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 1000000; // Search last ~1M blocks

    console.log(`\nSearching blocks ${fromBlock} to ${currentBlock}...`);

    // Search for PreliminaryResolution event
    try {
      const prelimFilter = eventContract.filters.PreliminaryResolution();
      const prelimEvents = await eventContract.queryFilter(prelimFilter, fromBlock, currentBlock);

      if (prelimEvents.length > 0) {
        console.log('\n🤖 PRELIMINARY RESOLUTION EVENTS:');
        for (const event of prelimEvents) {
          const block = await event.getBlock();
          const outcomes = ['Unset', 'Yes', 'No'];
          console.log(`  Block ${event.blockNumber}:`, new Date(block.timestamp * 1000).toLocaleString());
          console.log(`    Outcome: ${outcomes[Number(event.args[0])]}`);
          console.log(`    Timestamp: ${new Date(Number(event.args[1]) * 1000).toLocaleString()}`);
        }
      }
    } catch (e) {
      console.log('⚠️  No preliminary resolution events found');
    }

    // Search for FinalResolution event
    try {
      const finalFilter = eventContract.filters.FinalResolution();
      const finalEvents = await eventContract.queryFilter(finalFilter, fromBlock, currentBlock);

      if (finalEvents.length > 0) {
        console.log('\n✅ FINAL RESOLUTION EVENTS (Market Finalized - No More Disputes):');
        for (const event of finalEvents) {
          const block = await event.getBlock();
          const outcomes = ['Unset', 'Yes', 'No'];
          console.log(`  Block ${event.blockNumber}:`, new Date(block.timestamp * 1000).toLocaleString());
          console.log(`    Outcome: ${outcomes[Number(event.args[0])]}`);
          console.log(`    Confidence: ${event.args[1]}%`);
          console.log(`    Timestamp: ${new Date(Number(event.args[2]) * 1000).toLocaleString()}`);
          console.log(`    🔒 DISPUTE WINDOW CLOSED AT THIS TIME`);
        }
      } else {
        console.log('\n⚠️  No final resolution events found (market might still be disputable)');
      }
    } catch (e) {
      console.log('⚠️  Could not search for final resolution events:', e.message);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(80));
}

checkMarketStatus();
