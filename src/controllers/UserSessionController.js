const connection = require('../database/connection')
const bcrypt = require('bcrypt')

module.exports = {
  async create(request, response) {
    try {
      const requiredFields = ['email', 'password']
      const missingFields = requiredFields.filter(field => !(field in request.body))
      if (missingFields.length > 0) {
        return response.status(400).json({
          message: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}`
        })
      }
      const { email, password } = request.body
      const user = await getUserByEmail(email)
      if (!user) {
        return response.status(401).json({
          error: 'O usuário informado não existe!'
        })
      }
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return response.status(401).json({
          error: 'Cradenciais de acesso inválidas!'
        })
      }
      return response.status(200).json(user)
    } catch {
      return response.status(404).json({
        error: 'Não foi possível realizar o email.'
      })
    }
  }
}

async function getUserByEmail (email) {
  return (await connection`SELECT * FROM users WHERE email = ${email}`).find(user => user.email === email)
}