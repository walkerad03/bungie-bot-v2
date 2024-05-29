class Logger {
  _getCurrentTimestamp() {
    return new Date().toISOString();
  }

  logError(message, error=null) {
    const current_date = this._getCurrentTimestamp();
    console.error(`${current_date} [ERROR] ${message}\nError: ${error}`);
  }

  logInfo(message) {
    const current_date = this._getCurrentTimestamp();
    console.log(`${current_date} [INFO] ${message}`);
  }

  logWarn(message) {
    const current_date = this._getCurrentTimestamp();
    console.warn(`${current_date} [WARN] ${message}`);
  }

  logDebug(message) {
    const current_date = this._getCurrentTimestamp();
    console.debug(`${current_date} [DEBUG] ${message}`);
  }
}

module.exports = Logger;