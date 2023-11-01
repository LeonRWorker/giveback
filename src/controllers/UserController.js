const connection = require('../database/connection')
const crypto = require('crypto')
const bcrypt = require('bcrypt')

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
    // Verificar se é um administrador
    const admiExist = await getAdmin(session_id)
    if (!admiExist && session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um administrador para cadastrar um usuário.'
      })
    }
    // Verificar se os campos foram preenchidos
    const requiredFields = ['name', 'login', 'password']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Dados do corpo da requisição
    const { name, login, password } = request.body
    // Gerar id do usuário
    const id = crypto.randomBytes(4).toString('hex')
    // Criptografar senha
    const hashedPassword = bcrypt.hashSync(password, 10)
    // Tentar cadastrar usuário no banco de dados 
    try {
      // Cadastrar usuário
      await creatUser(id, name, login, hashedPassword)
      // Verificar se o usuário foi cadastrado
      const user = await getUser(id)
      // Retornar usuário ou erro
      if (user) {
        return response.status(201).json(user)
      } else {
        return response.status(500).json({
          error: 'Não foi possível cadastrar o usuário.'
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
    // Verificar se é um administrador
    const admiExist = await getAdmin(session_id)
    if (!admiExist && session_id !== adminSecret) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um administrador para listar todos os usuários.'
      })
    }
    const users = await getAllUsers()
    if (users.length >= 1) {
      return response.status(200).json(users)
    } else {
      return response.status(500).json({
        error: 'Não existe usuários cadastrados no sistema'
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
    // Verificar se tem permissão
    const userExist = await getUser(session_id)
    if (!userExist) {
      const admiExist = await getAdmin(session_id)
      if (!admiExist && session_id !== adminSecret) {
        return response.status(401).json({
          error: 'Operação não permitida! Você precisa precisa ser um administrador para listar as informações do usuário informado.'
        })
      }
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params.id
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o usuário que deseja listar as informações.'
      })
    }
    // Verificar se o session_id é diferente do id nos parâmetros
    if (userExist) {
      const user = await getUser(id)
      if (user && user.id !== session_id) {
        return response.status(401).json({
          error: 'O usuário informado e o usuário logado são diferentes. Você não tem permissão para realizar essa ação.'
        })
      }
    }
    const user = await getUser(id)
    if (user) {
      if (!user.isActive) {
        return response.status(404).json('O usuário informado foi desativado! Você não pode listar informações desse usuário.')
      }
      return response.status(200).json(user)
    } else {
      return response.status(404).json({
        error: 'O usuário informado não foi encontrado.'
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
    const userExist = await getUser(session_id)
    if (!userExist) {
      const admiExist = await getAdmin(session_id)
      if (!admiExist && session_id !== adminSecret) {
        return response.status(401).json({
          error: 'Operação não permitida! Você precisa precisa das permissões necessárias para atualizar as informações do usuário informado.'
        })
      }
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params.id
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o usuário que deseja listar as informações.'
      })
    }
    // Verificar se o session_id é diferente do id nos parâmetros
    if (userExist) {
      const user = await getUser(id)
      if (user && user.id !== session_id) {
        return response.status(401).json({
          error: 'O usuário informado e o usuário logado são diferentes. Você não tem permissão para realizar essa ação.'
        })
      }
    }
    const user = await getUser(id)
    if (user && !user.isActive) {
      return response.status(404).json('O usuário informado foi desativado! Você não pode alterar informações desse usuário.')
    }
    if (!user) {
      return response.status(404).json({
        error: 'O usuário informado não foi encontrado.'
      })
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
      await updateUser(id, name, email, hashedPassword)
      return response.status(200)
    } catch {
      return response.status(500).json({
        error: 'Não foi possível atualizar o usuário informado'
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
    const userExist = await getUser(session_id)
    if (!userExist && session_id !== adminSecret) {
      const admiExist = await getAdmin(session_id)
      if (!admiExist) {
        return response.status(401).json({
          error: 'Operação não permitida! Você precisa precisa das permissões necessárias para remover o usuário informado.'
        })
      }
    }
    // Verificar se tem o id do usuário que deseja realizar a operação
    const { id } = request.params.id
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o usuário que deseja remover.'
      })
    }
    // Verificar se o session_id é diferente do id nos parâmetros
    if (userExist) {
      const user = await getUser(id)
      if (user && user.id !== session_id) {
        return response.status(401).json({
          error: 'O usuário informado e o usuário logado são diferentes. Você não tem permissão para realizar essa ação.'
        })
      }
    }
    // Tentar desativar ou retornar erro
    try {
      await disableUser(id)
      return response.status(200)
    } catch {
      return response.status(500).json({
        error: 'Erro de servidor interno'
      })
    }
  },
}

async function getAdmin (adminId) {
  return (await connection`SELECT * FROM admin WHERE id = ${adminId}`).find(admin => admin.id === adminId)
}
async function creatUser (userId, name, login, hashedPassword) {
  return (await connection`INSERT INTO users (id, registration, password) VALUES (${userId}, ${name}, ${login}, ${hashedPassword})`)
}
async function getAllUsers () {
  return (await connection`SELECT * FROM users`)
}
async function getUser (userId) {
  return (await connection`SELECT * FROM users WHERE id = ${userId}`).find(user => user.id === userId)
}
async function updateUser (userId, name, login, hashedPassword) {
  return (await connection`UPDATE users SET name = ${name}, login = ${login}, password = ${hashedPassword} WHERE id = ${userId}`)
}
async function disableUser (userId) {
  return (await connection`UPDATE users SET isActive = false WHERE id = ${userId}`)
}