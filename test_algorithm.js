const { simplifyDebts } = require('./utils/simplifyDebts');

console.log('--- Test 1: Simple chain A -> B -> C ---');
const debts1 = [
  { from: 'A', to: 'B', amount: 100 },
  { from: 'B', to: 'C', amount: 100 }
];
console.log('Input:', debts1);
console.log('Output:', simplifyDebts(debts1));
// Expected: A -> C 100

console.log('\n--- Test 2: Circular debt A -> B -> C -> A ---');
const debts2 = [
  { from: 'A', to: 'B', amount: 100 },
  { from: 'B', to: 'C', amount: 100 },
  { from: 'C', to: 'A', amount: 100 }
];
console.log('Input:', debts2);
console.log('Output:', simplifyDebts(debts2));
// Expected: [] (all settled)

console.log('\n--- Test 3: Complex uneven A -> B (100), B -> C (50), C -> A (20) ---');
const debts3 = [
  { from: 'A', to: 'B', amount: 100 },
  { from: 'B', to: 'C', amount: 50 },
  { from: 'C', to: 'A', amount: 20 }
];
console.log('Input:', debts3);
console.log('Output:', simplifyDebts(debts3));
// Net balances: A (-100 + 20 = -80), B (100 - 50 = +50), C (50 - 20 = +30)
// Expected: A -> B 50, A -> C 30 (or similar combination)

console.log('\n--- Test 4: Precision handling ---');
const debts4 = [
  { from: 'A', to: 'B', amount: 33.33 },
  { from: 'B', to: 'C', amount: 33.33 },
  { from: 'A', to: 'C', amount: 33.34 }
];
console.log('Input:', debts4);
console.log('Output:', simplifyDebts(debts4));
// Net: A = -66.67, B = 0, C = +66.67
// Expected: A -> C 66.67
