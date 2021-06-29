class AppError extends Error {
  initialError;
  timestamp;
  constructor(message, initialError = null) {
    super(message);
    this.initialError = initialError;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    return JSON.stringify(
      {
        message: this.message,
        initialErrorMessage: this?.initialError?.message,
        timestamp: this.timestamp,
      },
      null,
      2
    );
  }
}

module.exports = AppError;
