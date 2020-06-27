import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  transactionId: string;
}

class DeleteTransactionService {
  public async execute({ transactionId }: Request): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const transaction = await transactionsRepository.findOne(transactionId);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    await transactionsRepository.delete({
      id: transactionId,
    });
  }
}

export default DeleteTransactionService;
