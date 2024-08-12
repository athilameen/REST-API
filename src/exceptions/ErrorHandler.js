const { AppError, HttpCode } =  require("./AppError")

class ErrorHandler {
    
  isTrustedError(error) {
    if (error instanceof AppError) {
      return error.isOperational
    }

    return false
  }

  handleError(error, response) {
    if (this.isTrustedError(error) && response) {
      this.handleTrustedError(error, response)
    } else {
      this.handleCriticalError(error, response)
    }
  }

  handleTrustedError(error, response) {
    response.status(error.httpCode).json({ message: error.message })
  }

  handleCriticalError(error, response) {
    if (response) {
      response
        .status(HttpCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: error.message })
    }

    console.log("Application encountered a critical error.")
    // process.exit(1);
  }
}

const errorHandler = new ErrorHandler()
module.exports = errorHandler;