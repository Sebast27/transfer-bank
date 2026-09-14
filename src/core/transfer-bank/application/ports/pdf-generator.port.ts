export const PDF_GENERATOR_PORT = 'PDF_GENERATOR_PORT';

export interface IPdfGeneratorPort {
  generateStatement(data: {
    accountNumber: string;
    ownerName: string;
    balance: number;
    periodStart: Date;
    periodEnd: Date;
    transactions: Array<{
      date: Date;
      type: string;
      amount: number;
      balance: number;
      description: string;
    }>;
  }): Promise<string>; // Returns file path
}