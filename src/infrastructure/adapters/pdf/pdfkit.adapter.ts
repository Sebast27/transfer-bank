import { Injectable, Logger } from '@nestjs/common';
import { IPdfGeneratorPort } from '../../../core/transfer-bank/application/ports/pdf-generator.port';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfKitAdapter implements IPdfGeneratorPort {
  private readonly logger = new Logger(PdfKitAdapter.name);

  async generateStatement(data: {
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
  }): Promise<string> {
    this.logger.log(`📄 Generando PDF para cuenta ${data.accountNumber}`);

    // 1. Ensure directory exists
    const outputDir = path.join(process.cwd(), 'storage', 'statements');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Generate file path
    const fileName = `statement-${data.accountNumber}-${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // 3. Create PDF
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('BANCO DIGITAL', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('ESTADO DE CUENTA', { align: 'center' });
        doc.moveDown(2);

        // Account info
        doc.fontSize(12);
        doc.text(`Cuenta: ${data.accountNumber}`);
        doc.text(`Titular: ${data.ownerName}`);
        doc.text(`Período: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`);
        doc.text(`Saldo actual: $${data.balance.toFixed(2)}`);
        doc.moveDown();

        // Transactions table
        doc.fontSize(14).text('Movimientos', { underline: true });
        doc.moveDown();

        if (data.transactions.length === 0) {
          doc.fontSize(10).text('No hay movimientos en este período');
        } else {
          data.transactions.forEach((tx) => {
            doc.fontSize(10);
            doc.text(`${tx.date.toLocaleDateString()} | ${tx.type} | $${tx.amount.toFixed(2)} | ${tx.description}`);
          });
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`✅ PDF generado: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          this.logger.error(`❌ Error generando PDF: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}