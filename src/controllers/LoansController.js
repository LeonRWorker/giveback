const connection = require('../database/connection')
const crypto = require('crypto')

module.exports = {
  async create (request, response) {
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
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para cadastrar um empréstimo.'
      })
    }
    // Verificar se os campos foram preenchidos
    const requiredFields = ['borrowedby','loanedto','name','category','observations','finaldate']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Dados do corpo da requisição
    const { borrowedby, loanedto, name, category, observations, finaldate } = request.body
    // Gerar id do empréstimo
    const id = crypto.randomBytes(4).toString('hex')
    // Tentar registrar o empréstimo ou retornar erro 
    try {
      // Registrar empréstimo
      await registerLoan(id, borrowedby, loanedto, name, category, observations, Date.parse(finaldate), 'inday')
      // Verificar se o usuário foi cadastrado
      const itemLoan = await getLoanById(id)
      // Retornar usuário ou erro
      if (itemLoan) {
        return response.status(201).json(itemLoan)
      } else {
        return response.status(500).json({
          error: 'Não foi possível registrar o empréstimo.'
        })
      }
    } catch (error) {
      return response.status(500).json({
        error: 'Erro de servidor interno.',
        message: error.message
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
    // Verificar se é um usuário
    const userExist = await getUser(session_id)
    if (!userExist) {
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para listar todos os empréstimos.'
      })
    }
    const loans = await getAllLoansByUserId(session_id)
    if (loans.length >= 1) {
      return response.status(200).json(loans)
    } else {
      return response.status(500).json({
        error: 'Não existe empréstimos registrados no sistema para o usuário informado.'
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
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para listar as informações do empréstimo informado.'
      })
    }
    // Verificar se tem o id do empréstimo que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o empréstimo que deseja listar as informações.'
      })
    }
    // Verificar se o empréstimo informado existe
    const loanExist = await getLoanById(id)
    if (!loanExist) {
      return response.status(404).json({
        error: 'O empréstimo informado não existe.'
      })
    }
    // Verificar se o usuário que realizou o impréstimo é o mesmo logado
    if (loanExist.borrowedby !== session_id) {
      return response.status(401).json({
        error: 'Você não está autorizado a listar informações de empréstimo de outros usuários.'
      })
    }
    return response.status(200).json(loanExist)
  },
  async update (request, response) {
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
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para alterar as informações do empréstimo informado.'
      })
    }
    // Verificar se tem o id do empréstimo que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o empréstimo que deseja alterar as informações.'
      })
    }
    // Verificar se o empréstimo informado existe
    const loanExist = await getLoanById(id)
    if (!loanExist) {
      return response.status(404).json({
        error: 'O empréstimo informado não existe.'
      })
    }
    // Verificar se o usuário que realizou o impréstimo é o mesmo logado
    if (loanExist.borrowedby !== session_id) {
      return response.status(401).json({
        error: 'Você não está autorizado a alterar as informações de empréstimo de outros usuários.'
      })
    }
    // Verificar se os campos foram preenchidos
    const requiredFields = ['loanedto','name','category','observations', 'finaldate']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Dados do corpo da requisição
    const { loanedto, name, category, observations, finaldate } = request.body
    // Alterar as informações ou retornar erro
    try {
      await updateLoanDetails(id, loanedto, name, category, observations, Date.parse(finaldate))
      return response.status(200).json({
        message: 'Informações do empréstimo atualizadas com sucesso!'
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Não foi possível atualizar os detalhes do empréstimo informado.',
        message: error.message
      })
    }
  },
  async updateStatus(request, response) {
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
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para alterar as informações do empréstimo informado.'
      })
    }
    // Verificar se tem o id do empréstimo que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o empréstimo que deseja alterar as informações.'
      })
    }
    // Verificar se o empréstimo informado existe
    const loanExist = await getLoanById(id)
    if (!loanExist) {
      return response.status(404).json({
        error: 'O empréstimo informado não existe.'
      })
    }
    // Verificar se o usuário que realizou o impréstimo é o mesmo logado
    if (loanExist.borrowedby !== session_id) {
      return response.status(401).json({
        error: 'Você não está autorizado a alterar as informações de empréstimo de outros usuários.'
      })
    }
    // Verificar se os campos foram preenchidos
    const requiredFields = ['status']
    const missingFields = requiredFields.filter(field => !(field in request.body))
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` })
    }
    // Dados do corpo da requisição
    const { status } = request.body
    // Alterar as informações ou retornar erro
    try {
      await updateLoanStatus(id, status)
      return response.status(200).json({
        message: 'Status do empréstimo atualizado com sucesso!'
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Não foi possível atualizar o status do empréstimo informado.',
        message: error.message
      })
    }
  },
  async updateLateLoans() {
    // Pegar data atual
    const currentDate = new Date()
    // Buscar todos os empréstimos
    const loans = await getAllLoans()
    // Percorrer os empréstimos
    for (const loan of loans) {
      // Verificar se a data atual ultrapassou a data estipulada, onde o status seja diferente de atrasado e diferente de finalizado
      if (loan.finaldate.getTime() < currentDate.getTime() && loan.status !== 'late' && loan.status  !== 'inday') {
        // Atualize o status para 'atrasado'
        await updateLoanStatus(loan.id, 'late')
      }
    }
  },
  async delete(request, response) {
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
      return response.status(401).json({
        error: 'Operação não permitida! Você precisa precisa ser um usuário para remover o empréstimo informado.'
      })
    }
    // Verificar se tem o id do empréstimo que deseja realizar a operação
    const { id } = request.params
    if (!id) {
      return response.status(400).json({
        error: 'Você não especificou o empréstimo que deseja remover.'
      })
    }
    // Verificar se o empréstimo informado existe
    const loanExist = await getLoanById(id)
    if (!loanExist) {
      return response.status(404).json({
        error: 'O empréstimo informado não existe.'
      })
    }
    // Verificar se o usuário que realizou o impréstimo é o mesmo logado
    if (loanExist.borrowedby !== session_id) {
      return response.status(401).json({
        error: 'Você não está autorizado a remover empréstimos de outros usuários.'
      })
    }    // Alterar as informações ou retornar erro
    try {
      await deleteLoan(id,)
      return response.status(202).json({
        message: 'Empréstimo removido com sucesso!'
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Não foi possível atualizar o status do empréstimo informado.',
        message: error.message
      })
    }
  }
}

async function getUser (userId) {
  return (await connection`SELECT * FROM users WHERE id = ${userId}`).find(user => user.id === userId)
}
async function registerLoan (loanId, borrowedby, loanedto, name, category, observations, finaldate, status) {
  return (await connection`INSERT INTO loans (id, borrowedby, loanedto, name, category, observations, finaldate, status) VALUES (${loanId}, ${borrowedby}, ${loanedto}, ${name}, ${category}, ${observations}, ${finaldate}, ${status})`)
}
async function getLoanById (loanId) {
  return (await connection`SELECT * FROM loans WHERE id = ${loanId}`).find(loan => loan.id === loanId)
}
async function getAllLoansByUserId (userId) {
  return (await connection`SELECT * FROM loans WHERE borrowedby = ${userId}`)
}
async function getAllLoans () {
  return (await connection`SELECT finaldate, status FROM loans`)
}
async function updateLoanDetails (loanId, loanedto, name, category, observations, finaldate) {
  return (await connection`UPDATE loans SET name = ${name}, loanedto = ${loanedto}, category = ${category}, observations = ${observations}, finaldate = ${finaldate} WHERE id = ${loanId}`)
}
async function updateLoanStatus (loanId, status) {
  return (await connection`UPDATE loans SET status = ${status} WHERE id = ${loanId}`)
}
async function deleteLoan(loanId) {
  return (await connection`DELETE FROM loans WHERE id = ${loanId}`)
}