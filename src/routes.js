const express = require('express')
const routes = express.Router()

const AdminController = require('./controllers/AdminController')
const UserController = require('./controllers/UserController')
const AdminSessionController = require('./controllers/AdminSessionController')
const UserSessionController = require('./controllers/UserSessionController')
const LoansController = require('./controllers/LoansController')

routes.post('/admin', AdminController.create)
routes.get('/admin', AdminController.index)
routes.get('/admin/:id', AdminController.show)
routes.put('/admin/:id', AdminController.update)
routes.delete('/admin/:id', AdminController.delete)

routes.post('/users', UserController.create)
routes.get('/users', UserController.index)
routes.get('/users/:id', UserController.show)
routes.put('/users/:id', UserController.update)
routes.delete('/users/:id', UserController.delete)

routes.post('/user-session', UserSessionController.create)
routes.post('/admin-session', AdminSessionController.create)

routes.post('/loans', LoansController.create)
routes.get('/loans', LoansController.index)
routes.get('/loans/:id', LoansController.show)
routes.put('/loans/:id', LoansController.update)

module.exports = routes