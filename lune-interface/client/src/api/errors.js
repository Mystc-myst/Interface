export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class CancelledError extends Error {
  constructor(message = 'Request was cancelled') {
    super(message);
    this.name = 'CancelledError';
  }
}
