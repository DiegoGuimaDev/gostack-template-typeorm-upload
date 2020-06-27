import { getCustomRepository, getManager } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

function isValidType(type: string): boolean {
  return ['income', 'outcome'].indexOf(type) > -1;
}

function hasValidValue(value: number): boolean {
  return value >= 0;
}

async function hasAmountToDoOutcome(value: number): Promise<boolean> {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const balance = await transactionsRepository.getBalance();

  return balance.total >= value;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!isValidType(type)) {
      throw new AppError('Invalid Transaction type');
    }

    if (!hasValidValue(value)) {
      throw new AppError('Value of transaction cannot be lass then zero');
    }

    if (type === 'outcome') {
      const hasAmountToDo = await hasAmountToDoOutcome(value);
      if (!hasAmountToDo) {
        throw new AppError("You don't have amount to do this outcome");
      }
    }

    return getManager().transaction(async trx => {
      async function createCategoryIfNeedAndReturnId(
        categoryToUse: string,
      ): Promise<string> {
        const databaseCategory = await trx.findOne(Category, {
          title: categoryToUse,
        });
        if (!databaseCategory) {
          const newCategory = await trx.create(Category, {
            title: categoryToUse,
          });
          await trx.save(Category, newCategory);
          return newCategory.id;
        }
        return databaseCategory.id;
      }

      const categoryId = await createCategoryIfNeedAndReturnId(category);

      const newTransaction = trx.create(Transaction, {
        title,
        value,
        type,
        category_id: categoryId,
      });

      await trx.save(Transaction, newTransaction);

      return newTransaction;
    });
  }
}

export default CreateTransactionService;
