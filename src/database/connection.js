const postgres = require('postgres')

const connection = postgres({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: 'require',
  connection: {
    options: `project=${process.env.ENDPOINT_ID}`
  }
})

module.exports = connection