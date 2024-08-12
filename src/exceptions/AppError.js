let HttpCode;

(function(HttpCode) {
  HttpCode[(HttpCode["OK"] = 200)] = "OK"
  HttpCode[(HttpCode["NO_CONTENT"] = 204)] = "NO_CONTENT"
  HttpCode[(HttpCode["BAD_REQUEST"] = 400)] = "BAD_REQUEST"
  HttpCode[(HttpCode["UNAUTHORIZED"] = 401)] = "UNAUTHORIZED"
  HttpCode[(HttpCode["FORBIDDEN"] = 403)] = "FORBIDDEN"
  HttpCode[(HttpCode["NOT_FOUND"] = 404)] = "NOT_FOUND"
  HttpCode[(HttpCode["INTERNAL_SERVER_ERROR"] = 500)] = "INTERNAL_SERVER_ERROR"
})(HttpCode || (HttpCode = {}))


class AppError extends Error {
  //isOperational = true;

  constructor(args) {
    super(args.description)

    Object.setPrototypeOf(this, new.target.prototype)

    this.name = args.name || "Error"
    this.httpCode = args.httpCode

    if (args.isOperational !== undefined) {
      this.isOperational = args.isOperational
    }

    Error.captureStackTrace(this)
  }
}

module.exports = {
    HttpCode,
    AppError
};