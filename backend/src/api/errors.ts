export class HTTPException extends Error {
  constructor(
    public statusCode: number,
    message?: string
  ) {
    super(message);
    this.name = 'HTTPException';
  }
}

export const forbidden = () => new HTTPException(403, 'Forbidden');
export const unauthorized = () => new HTTPException(401, 'Unauthorized');
export const notFound = () => new HTTPException(404, 'Not Found');

export class PlatformaticError extends Error {
  public readonly key: string;
  public readonly detail: string;
  public readonly code: number;
  public readonly shouldLog: boolean;

  constructor(params: {
    key?: string;
    baseError?: Error;
    detail?: string;
    code?: number;
    shouldLog?: boolean;
  }) {
    const message = params.baseError?.message || params.detail || 'Unknown error';
    super(message);

    this.key = params.key || '';
    this.name = 'PlatformaticError';
    this.detail = params.detail || message;
    this.code = params.code || 409;
    this.shouldLog = params.shouldLog ?? true;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      detail: this.detail,
      code: this.code,
      stack: this.shouldLog ? this.stack : undefined,
    };
  }
}

export class OpenAIError extends PlatformaticError {
  constructor(params: {
    baseError?: Error;
    detail?: string;
    code?: number;
    shouldLog?: boolean;
  }) {
    super(params);
    this.name = 'OpenAIError';
  }
}

export class ReplicateError extends PlatformaticError {
  constructor(params: {
    baseError?: Error;
    detail?: string;
    code?: number;
    shouldLog?: boolean;
  }) {
    super(params);
    this.name = 'ReplicateError';
  }
}

export class MaxLoopsError extends PlatformaticError {
  constructor(params: {
    baseError?: Error;
    detail?: string;
    code?: number;
    shouldLog?: boolean;
  }) {
    super(params);
    this.name = 'MaxLoopsError';
  }
}

export class MultipleSummaryError extends PlatformaticError {
  constructor(params: {
    baseError?: Error;
    detail?: string;
    code?: number;
    shouldLog?: boolean;
  }) {
    super(params);
    this.name = 'MultipleSummaryError';
  }
}

// Helper functions to create errors with default values
export const createOpenAIError = (detail: string, code: number = 500) =>
  new OpenAIError({ detail, code });

export const createReplicateError = (detail: string, code: number = 500) =>
  new ReplicateError({ detail, code });

export const createMaxLoopsError = (detail: string, code: number = 400) =>
  new MaxLoopsError({ detail, code });

export const createMultipleSummaryError = (detail: string, code: number = 400) =>
  new MultipleSummaryError({ detail, code });
