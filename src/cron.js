const LoanController = require('./controllers/LoanController')
const cron = require('node-cron')

cron.schedule('0 12 * * *', async () => {
  try {
    await LoanController.updateLateLoans()
  } catch (error) {
    console.log(`Erro: ${error}`)
  }
})