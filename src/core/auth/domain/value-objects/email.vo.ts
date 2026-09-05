export class Email {
  private readonly value: string;

  constructor(value: string) {
    this.validateEmail(value);
    this.value = value;
  }


  private validateEmail(email: string): void {
    
    if (!email.includes('@')) {
      throw new Error('Email must contain @');
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Email must be in format: user@domain');
    }

    const localPart = parts[0];
    const domain = parts[1];

    
    if (localPart.length < 1) {
      throw new Error('Email must have a local part before @');
    }

    
    if (!domain.includes('.')) {
      throw new Error('Domain must have a valid extension (e.g., .com, .es)');
    }

    
    const validExtensions = ['.com', '.es', '.org', '.net', '.io', '.dev', '.app', '.edu', '.gov'];
    const hasValidExtension = validExtensions.some(ext => domain.endsWith(ext));
    if (!hasValidExtension) {
      throw new Error(`Domain must have a valid extension: ${validExtensions.join(', ')}`);
    }

    
    const domainParts = domain.split('.');
    if (domainParts[0].length < 2) {
      throw new Error('Domain must have at least 2 characters before the extension');
    }
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  isCorporate(): boolean {
    const corporateDomains = ['banco.com', 'finanzas.com', 'corp.com'];
    return corporateDomains.includes(this.getDomain());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}