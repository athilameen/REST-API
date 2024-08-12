const { AppError } =  require("../exceptions/AppError")

const responseMiddleware = (req, res, next) => {
    
  // Create a success response function
  res.success = (data, message) => {
    const response = { success: true, data, message }
    res.json(response)
  }

  // Create an error response function
  res.error = (httpCode, description) => {
    throw new AppError({
      httpCode,
      description
    })
  }

  next()
}

module.exports = responseMiddleware;