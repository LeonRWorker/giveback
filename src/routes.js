const express = require('express')
const routes = express.Router()

const AdminController = require('./controllers/AdminController')
const UserController = require('./controllers/UserController')
const AdminSessionController = require('./controllers/AdminSessionController')
const UserSessionController = require('./controllers/UserSessionController')
const ItemController = require('./controllers/ItemController')
const CategoryController = require('./controllers/CategoryController')
const ToGiveBackController = require('./controllers/ToGiveBackController')

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

routes.post('/categories', CategoryController.create)
routes.get('/categories', CategoryController.index)
routes.get('/categories/:id', CategoryController.show)
routes.put('/categories/:id', CategoryController.update)
routes.delete('/categories/:id', CategoryController.delete)

routes.post('/items', ItemController.create)
routes.get('/items', ItemController.index)
routes.get('/items/:id', ItemController.show)
routes.put('/items/:id', ItemController.update)
routes.delete('/items/:id', ItemController.delete)

routes.post('/giveback', ToGiveBackController.create)
routes.get('/giveback', ToGiveBackController.index)
routes.get('/giveback/:id', ToGiveBackController.show)
routes.put('/giveback/:id', ToGiveBackController.update)
routes.delete('/giveback/:id', ToGiveBackController.delete)


module.exports = routes