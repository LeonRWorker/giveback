const connection = require('../database/connection')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const adminSecret = process.env.SESSION_ADMIN_ID

module.exports = {
  async create (request, response) {
    // Verificar se tem sessão
    const session_id = request.headers.session_id
    if (!session_id) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa estar autenticado para realizar essa operação.'
      })
    }
    // Verificar se é um administrador secreto
    if (session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um administrador para cadastrar outro administrador.'
      })
    }
    // Verificar se os campos foram preenchidos
    const requiredFields = ['name', 'password', 'email']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Dados do corpo da requisição
    const { name, password, email } = request.body
    // Verificar se o administrador existe
    const admin = await getAdminByEmail(email)
    if (admin) {
      return response.status(401).json({
        error: 'O administrador informado já existe!'
      })
    }
    // Gerar id do usuário
    const id = crypto.randomBytes(4).toString('hex')
    // Criptografar senha
    const hashedPassword = bcrypt.hashSync(password, 10)
    // Tentar cadastrar usuário no banco de dados
    try {
      // Cadastro de usuário
      await createAdmin(id, name, hashedPassword, email)
      // Verificar se o usuário foi cadastrado
      const admin = await getAdmin(id)
      // Retornar usuário ou erro
      if (admin) {
        return response.status(201).json(admin)
      } else {
        return response.status(500).json({
          error: 'Não foi possível cadastrar o administrador.'
        })
      }
    } catch {
      return response.status(500).json({
        error: 'Erro de servidor interno'
      })
    }
  },
  async index (request, response) {
    // Verificar se tem sessão
    const session_id = request.headers.session_id
    if (!session_id) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa estar autenticado para realizar essa operação.'
      })
    }
    // Verificar se é um administrador secreto
    if (session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um administrador mestre para listar todos os administradores.'
      })
    }
    // Retornar administradores o erro
    const adminsExist = await getAllAdmins()
    if (adminsExist.length >= 1) {
      return response.status(200).json(adminsExist)
    } else {
      return response.status(500).json({
        error: 'Não existe administradores cadastrados no sistema'
      })
    }
  },
  async show (request, response) {
    // Verificar se tem sessão
    const session_id = request.headers.session_id
    if (!session_id) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa estar autenticado para realizar essa operação.'
      })
    }
    // Verificar se é um administrador
    const admiExist = await getAdmin(session_id)
    if (!admiExist && session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa das permissões necessárias para listar as informações do administardor informado.'
      })
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o administrador que deseja listar as informações.'
      })
    }
    // Verificar se o session_id é diferente do id nos parâmetros
    if (admiExist) {
      const admin = await getAdmin(id)
      if (admin && admin.id !== session_id) {
        return response.status(401).json({
          error: 'O administrador informado e o administrador logado são diferentes. Você não tem permissão para realizar essa ação.'
        })
      }
    }
    const admin = await getAdmin(id)
    if (admin) {
      return response.status(200).json(admin)
    } else {
      return response.status(404).json({
        error: 'O administrador informado não foi encontrado.'
      })
    }
  },
  async update (request, response) {
    // Verificar se tem sessão
    const session_id = request.headers.session_id
    if (!session_id) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa estar autenticado para realizar essa operação.'
      })
    }
    // Verificar se é um administrador
    const admiExist = await getAdmin(session_id)
    if (!admiExist && session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa das permissões necessárias para alterar as informações do administardor informado.'
      })
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o administrador que deseja alterar as informações.'
      })
    }
    // Verificar se o session_id é diferente do id nos parâmetros
    if (admiExist) {
      const admin = await getAdmin(id)
      if (admin && admin.id !== session_id) {
        return response.status(401).json({
          error: 'O administrador informado e o administrador logado são diferentes. Você não tem permissão para realizar essa ação.'
        })
      }
      if (!admin) {
        return response.status(404).json({
          error: 'O administrador informado não existe.'
        })
      }
    }
    // Verificar se todos os campos necessários foram fornecidos
    const requiredFields = ['name', 'password', 'email']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Alterar as novas informações
    const { name, password, email } = request.body
    const hashedPassword = bcrypt.hashSync(password, 10)
    try {
      await updateAdmin(id, name, email, hashedPassword)
      return response.status(200)
    } catch {
      return response.status(500).json({
        error: 'Não foi possível atualizar o administrador informado'
      })
    }
  },
  async delete (request, response) {
    // Verificar se tem sessão
    const session_id = request.headers.session_id
    if (!session_id) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa estar autenticado para realizar essa operação.'
      })
    }
    // Verificar se é um administrador
    if (session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa das permissões necessárias para remover o administardor informado.'
      })
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o administrador que deseja remover.'
      })
    }
    // Tentar remover o administrador
    try {
      await deleteAdmin(id)
      const adminNotExist = await getAdmin(id)
      if (!adminNotExist) {
        return response.status(200)
      }
      return response.status(500).json({
        error: 'Não foi possível remover o administrador informado'
      })
    } catch {
      return response.status(500).json({
        error: 'Erro de servidor interno'
      })
    }
  }
}

async function getAdminByEmail (email) {
  return (await connection`SELECT * FROM admin WHERE email = ${email}`).find(admin => admin.email === email)
}
async function createAdmin (admin_id, name, hashedPassword, email) {
  return (await connection`INSERT INTO admin (id, name, email, password) VALUES (${admin_id}, ${name}, ${email}, ${hashedPassword})`)
}
async function getAdmin (admin_id) {
  return (await connection`SELECT * FROM admin WHERE id = ${admin_id}`).find(admin => admin.id === admin_id)
}
async function getAllAdmins () {
  return (await connection`SELECT * FROM admin`)
}
async function updateAdmin (admin_id, name, email, hashedPassword) {
  return (await connection`UPDATE admin SET name = ${name}, email = ${email}, password = ${hashedPassword} WHERE id = ${admin_id}`)
}
async function deleteAdmin (admin_id) {
  return (await connection`DELETE FROM admin WHERE id = ${admin_id}`)
}