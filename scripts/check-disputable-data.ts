import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkMarkets() {
  // Get markets that show as disputable in UI
  const marketQuestions = [
    'Quel sera le prix du DOGECOIN à la fin du mois d\'octobre?',
    'will bitcoin reach 130k this week ?',
    'marché test pour submission evidence',
    'Will this test market expire successfully in the next 10 minutes?',
    'esssssssssssssssaie'
  ];

  console.log('\n=== DISPUTABLE MARKETS DATA ANALYSIS ===\n');

  for (const question of marketQuestions) {
    const { data, error } = await supabase
      .from('approved_markets')
      .select('*')
      .ilike('claim', `%${question.substring(0, 20)}%`)
      .single();

    if (error) {
      console.log(`❌ Error for "${question.substring(0, 40)}...":`, error.message);
      continue;
    }

    if (!data) {
      console.log(`❌ Not found: "${question.substring(0, 40)}..."`);
      continue;
    }

    console.log(`\n📊 Market: ${data.claim.substring(0, 60)}...`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Available fields:`, Object.keys(data));
    console.log(`   Dispute Period End: ${(data as any).dispute_period_end || 'NOT SET'}`);
    console.log(`   Expired At: ${(data as any).expired_at || 'NOT SET'}`);

    const endTimeField = (data as any).end_time || (data as any).expiration_time || (data as any).expires_at;
    if (endTimeField) {
      console.log(`   End Time: ${endTimeField}`);
    }

    if (data.resolution_data) {
      console.log(`   Resolution Data:`, JSON.stringify(data.resolution_data, null, 2));
    }

    // Calculate what the UI would show
    if ((data as any).dispute_period_end) {
      const disputeEnd = new Date((data as any).dispute_period_end);
      const now = new Date();
      const timeLeft = disputeEnd.getTime() - now.getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      console.log(`   UI Display: ${daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`} to dispute`);
      console.log(`   Dispute Period End Date: ${disputeEnd.toLocaleString('en-US', { timeZone: 'UTC' })}`);
    } else if ((data as any).expired_at) {
      const expiredAt = new Date((data as any).expired_at);
      const disputeEnd = new Date(expiredAt.getTime() + 168 * 60 * 60 * 1000);
      const now = new Date();
      const timeLeft = disputeEnd.getTime() - now.getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      console.log(`   ⚠️  Using expired_at fallback`);
      console.log(`   Expired At: ${expiredAt.toLocaleString('en-US', { timeZone: 'UTC' })}`);
      console.log(`   Calculated Dispute End: ${disputeEnd.toLocaleString('en-US', { timeZone: 'UTC' })}`);
      console.log(`   UI Display: ${daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`} to dispute`);
    } else if (endTimeField) {
      const endTime = new Date(endTimeField);
      const disputeEnd = new Date(endTime.getTime() + 168 * 60 * 60 * 1000);
      const now = new Date();
      const timeLeft = disputeEnd.getTime() - now.getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      console.log(`   ⚠️  Using end time fallback`);
      console.log(`   End Time: ${endTime.toLocaleString('en-US', { timeZone: 'UTC' })}`);
      console.log(`   Calculated Dispute End: ${disputeEnd.toLocaleString('en-US', { timeZone: 'UTC' })}`);
      console.log(`   UI Display: ${daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`} to dispute`);
    }
  }
}

checkMarkets().catch(console.error);
