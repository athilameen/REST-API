 const joiValidate = async (schema, data) => {
    try {
      const value = await schema.validateAsync(data)
      return { success: true, data: value, message: "Valid" }
    } catch (err) {
       
      return { success: false, message: err.message }
    }
}
  
module.exports = joiValidate
  