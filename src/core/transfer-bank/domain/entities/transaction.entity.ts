import { Money } from '../value-objects/money.vo';

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Transaction {
  private _id: string;
  private _fromAccount: string;
  private _toAccount: string;
  private _amount: Money;
  private _status: TransactionStatus;
  private _reference?: string;
  private _createdAt: Date;
  private _completedAt?: Date;

  constructor(props: {
    id?: string;
    fromAccount: string;
    toAccount: string;
    amount: Money;
    status?: TransactionStatus;
    reference?: string;
    createdAt?: Date;
    completedAt?: Date;
  }) {
    this._id = props.id || crypto.randomUUID();
    this._fromAccount = props.fromAccount;
    this._toAccount = props.toAccount;
    this._amount = props.amount;
    this._status = props.status || TransactionStatus.PENDING;
    this._reference = props.reference;
    this._createdAt = props.createdAt || new Date();
    this._completedAt = props.completedAt;
  }

  // Getters
  get id(): string { return this._id; }
  get fromAccount(): string { return this._fromAccount; }
  get toAccount(): string { return this._toAccount; }
  get amount(): Money { return this._amount; }
  get status(): TransactionStatus { return this._status; }
  get reference(): string | undefined { return this._reference; }
  get createdAt(): Date { return this._createdAt; }
  get completedAt(): Date | undefined { return this._completedAt; }

  // Métodos de negocio
  isPending(): boolean {
    return this._status === TransactionStatus.PENDING;
  }

  isCompleted(): boolean {
    return this._status === TransactionStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === TransactionStatus.FAILED;
  }

  markAsProcessing(): void {
    if (!this.isPending()) {
      throw new Error('Only one pending transaction can be processed.');
    }
    this._status = TransactionStatus.PROCESSING;
  }

  markAsCompleted(): void {
    if (this._status !== TransactionStatus.PROCESSING) {
      throw new Error('Only a processing transaction can be completed.');
    }
    this._status = TransactionStatus.COMPLETED;
    this._completedAt = new Date();
  }

  markAsFailed(): void {
    if (this._status !== TransactionStatus.PROCESSING && this._status !== TransactionStatus.PENDING) {
      throw new Error('Only a pending or processing transaction can be marked as failed.');
    }
    this._status = TransactionStatus.FAILED;
  }

  toJSON() {
    return {
      id: this._id,
      fromAccount: this._fromAccount,
      toAccount: this._toAccount,
      amount: this._amount.getValue(),
      status: this._status,
      reference: this._reference,
      createdAt: this._createdAt,
      completedAt: this._completedAt,
    };
  }
}