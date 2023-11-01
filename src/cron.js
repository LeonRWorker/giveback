const LoansController = require('./controllers/LoansController')
const cron = require('node-cron')

cron.schedule('0 12 * * *', async () => {
  try {
    await LoansController.updateLateLoans()
  } catch (error) {
    console.log(`Erro: ${error}`)
  }
})