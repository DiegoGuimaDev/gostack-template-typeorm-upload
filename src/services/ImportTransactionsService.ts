import fs from 'fs';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  file: any;
}

interface TransactionImportData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface TransactionImportGroup {
  income: TransactionImportData[];
  outcome: TransactionImportData[];
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    const fileContent = await fs.promises.readFile(file, 'utf-8');

    const fileLines = fileContent.split(/\r?\n/);

    const header = fileLines[0];

    if (!this.isValidHeader(header)) {
      throw new AppError(
        'Transaction file has invalid header format, use: [title, type, value, category]',
      );
    }

    const linesWithoutHeader = fileLines.slice(1, fileLines.length);

    const transactionsLines = linesWithoutHeader.filter(
      this.isValidTransactionLine,
    );

    const parsedTransactions = this.parseLinesToTransactionObject(
      transactionsLines,
    );

    const groupedTransactions = this.groupByType(parsedTransactions);

    const incomes = await Promise.all(
      groupedTransactions.income.map(createTransactionService.execute),
    );

    const outcomes = await Promise.all(
      groupedTransactions.outcome.map(createTransactionService.execute),
    );

    return [...incomes, ...outcomes];
  }

  private groupByType(
    transactions: TransactionImportData[],
  ): TransactionImportGroup {
    const groupedResult: TransactionImportGroup = {
      income: transactions.filter(transaction => transaction.type === 'income'),
      outcome: transactions.filter(
        transaction => transaction.type === 'outcome',
      ),
    };
    return groupedResult;
  }

  private isValidHeader(header: string): boolean {
    function isValidHeaderColumn(
      headerProp: string,
      columnName: string,
    ): boolean {
      return (
        headerProp != null && headerProp.trim().toLowerCase() === columnName
      );
    }

    const props = header.split(',');
    return (
      isValidHeaderColumn(props[0], 'title') &&
      isValidHeaderColumn(props[1], 'type') &&
      isValidHeaderColumn(props[2], 'value') &&
      isValidHeaderColumn(props[3], 'category')
    );
  }

  private isValidTransactionLine(line: string): boolean {
    if (line == null || line.trim() === '') return false;
    const props = line.split(',');

    return props.length === 4;
  }

  private parseLinesToTransactionObject(
    lines: string[],
  ): TransactionImportData[] {
    return lines.map(line => {
      const props = line.split(',');

      return {
        title: props[0].trim(),
        type: props[1].trim().toLowerCase() as 'income' | 'outcome',
        value: Number(props[2].trim()),
        category: props[3].trim(),
      };
    });
  }
}

export default ImportTransactionsService;
