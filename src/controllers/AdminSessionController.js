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
      const admin = await getAdminByEmail(email)
      if (!admin) {
        return response.status(401).json({
          error: 'O usuário informado não existe!'
        })
      }
      const isPasswordValid = await bcrypt.compare(password, admin.password)
      if (!isPasswordValid) {
        return response.status(401).json({
          error: 'Cradenciais de acesso inválidas!'
        })
      }
      return response.status(200).json(admin)
    } catch {
      return response.status(404).json({
        error: 'Não foi possível realizar o email.'
      })
    }
  }
}

async function getAdminByEmail (email) {
  return (await connection`SELECT * FROM admin WHERE email = ${email}`).find(admin => admin.email === email)
}