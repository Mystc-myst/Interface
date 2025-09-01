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

export class OfflineError extends Error {
  constructor(message = 'The application is currently offline. Your request has been queued.') {
    super(message);
    this.name = 'OfflineError';
  }
}
