const crypto = require("crypto");

exports.generateToken = ({ stringBase = "hex", byteLength = 48 } = {}) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(byteLength, (err, buffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(buffer.toString(stringBase))
        }
      })
    })
}
  