
export class Password {
  private readonly value: string;
  private readonly isHashed: boolean;

  constructor(value: string, isHashed: boolean = false) {
    if (!isHashed) {
      this.validatePassword(value);
    }
    this.value = value;
    this.isHashed = isHashed;
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character (!@#$%^&*())');
    }
  }

  getValue(): string {
    return this.value;
  }

  isHashedValue(): boolean {
    return this.isHashed;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}