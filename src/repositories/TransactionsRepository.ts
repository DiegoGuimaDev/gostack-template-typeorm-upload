import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    const reducer = (transaction: Transaction): void => {
      switch (transaction.type) {
        case 'income':
          balance.income += transaction.value;
          balance.total += transaction.value;
          break;

        case 'outcome':
        default:
          balance.outcome += transaction.value;
          balance.total -= transaction.value;
          break;
      }
    };

    const transactions = await this.find();
    transactions.forEach(reducer);
    return balance;
  }
}

export default TransactionsRepository;
