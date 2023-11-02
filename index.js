const express = require('express')
const cors = require('cors')
const routes = require('./src/routes')
const app = express()
require('dotenv').config()
require('./src/cron')

const PORT = process.env.PORT || 5173

app.use(cors())
app.use(express.json())
app.use('/', routes)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
