export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
