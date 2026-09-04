export class Money {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('The amount cannot be negative.');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Money): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: Money): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Money): boolean {
    return this.value < other.value;
  }

  add(other: Money): Money {
    return new Money(this.value + other.value);
  }

  subtract(other: Money): Money {
    return new Money(this.value - other.value);
  }

  toString(): string {
    return `${this.value.toFixed(2)}`;
  }
}