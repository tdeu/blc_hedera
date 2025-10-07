import {
  getCurrentUnixTimestamp,
  dateToUnixTimestamp,
  validateMarketExpirationDate,
  debugTimeComparison,
  addMinutes,
  addHours
} from '../src/utils/timeUtils';

console.log('\n🕐 TIMEZONE FIX VERIFICATION\n');
console.log('='.repeat(80));

// Get current time
const now = new Date();
console.log('\n📅 Current Time:');
console.log('   Local:', now.toLocaleString());
console.log('   ISO:', now.toISOString());
console.log('   Unix:', getCurrentUnixTimestamp());

// Test: Date 10 minutes from now
console.log('\n\n✅ TEST 1: Date 10 minutes in future');
console.log('='.repeat(80));
const future10min = new Date(Date.now() + 10 * 60 * 1000);
debugTimeComparison(future10min, 'Future +10min');

const validation10 = validateMarketExpirationDate(future10min, 60);
console.log('\nValidation Result:', validation10);

// Test: Date 1 hour from now
console.log('\n\n✅ TEST 2: Date 1 hour in future');
console.log('='.repeat(80));
const future1hour = new Date(Date.now() + 60 * 60 * 1000);
debugTimeComparison(future1hour, 'Future +1hour');

const validation1h = validateMarketExpirationDate(future1hour, 60);
console.log('\nValidation Result:', validation1h);

// Test: Date 5 seconds from now (should fail)
console.log('\n\n❌ TEST 3: Date 5 seconds in future (should FAIL)');
console.log('='.repeat(80));
const future5sec = new Date(Date.now() + 5 * 1000);
debugTimeComparison(future5sec, 'Future +5sec');

const validation5s = validateMarketExpirationDate(future5sec, 60);
console.log('\nValidation Result:', validation5s);

// Test: Date in the past (should fail)
console.log('\n\n❌ TEST 4: Date in past (should FAIL)');
console.log('='.repeat(80));
const past = new Date(Date.now() - 10 * 60 * 1000);
debugTimeComparison(past, 'Past -10min');

const validationPast = validateMarketExpirationDate(past, 60);
console.log('\nValidation Result:', validationPast);

// Test: Edge case - exactly now
console.log('\n\n❌ TEST 5: Exactly now (should FAIL)');
console.log('='.repeat(80));
const exactlyNow = new Date();
debugTimeComparison(exactlyNow, 'Exactly Now');

const validationNow = validateMarketExpirationDate(exactlyNow, 60);
console.log('\nValidation Result:', validationNow);

console.log('\n\n' + '='.repeat(80));
console.log('✅ TIMEZONE FIX TESTS COMPLETE');
console.log('='.repeat(80));
console.log('\nIf you see correct time differences above, the fix is working!\n');
