const express = require('express')
const cors = require('cors')
const routes = require('./src/routes')
const app = express()
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.port || 5173

app.use(cors({
  origin: '*',
  methods: ['PUT', 'POST', 'DELETE', 'GET', 'OPTIONS']
}))
app.use(express.json())
app.use('/', routes)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})