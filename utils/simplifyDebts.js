/**
 * Debt Simplification Algorithm
 * 
 * 1. Calculate net balances for all users based on existing debts.
 * 2. Separate into creditors (positive balance) and debtors (negative balance).
 * 3. Greedily match the highest debtor with the highest creditor.
 */

const simplifyDebts = (debts) => {
  const balances = new Map();

  // 1. Calculate net balances
  debts.forEach(debt => {
    // debtor owes money, so their balance decreases
    balances.set(debt.from.toString(), (balances.get(debt.from.toString()) || 0) - debt.amount);
    // creditor is owed money, so their balance increases
    balances.set(debt.to.toString(), (balances.get(debt.to.toString()) || 0) + debt.amount);
  });

  // 2. Separate into creditors and debtors
  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance < -0.01) { // use small epsilon for floating point errors
      debtors.push({ userId, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  }

  // Sort by amount descending
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // 3. Greedily match
  const simplifiedDebts = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    // Format to 2 decimal places to avoid floating point issues
    const formattedAmount = Math.round(settledAmount * 100) / 100;

    simplifiedDebts.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: formattedAmount
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return simplifiedDebts;
};

module.exports = { simplifyDebts };
