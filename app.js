const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const middleware = require('./utils/middleware')
const cors = require('cors')
const blogsRouter = require('./constollers/blogs')
const usersRouter = require('./constollers/users')
const loginRouter = require('./constollers/login')
const mongoose = require('mongoose')
const logger = require('./utils/logger')

const mongoUrl = config.MONGODB_URI

logger.info('connecting to', mongoUrl)

mongoose.connect(mongoUrl)
    .then(() => {
        logger.info('connected to MongoDB')
    })
    .catch((error) => {
        logger.error('error connecting to MongoDB:', error.message)
    })

app.use(cors())
app.use(express.json())

app.use(middleware.tokenExtractor)
app.use(middleware.userExtractor)

app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

app.use(middleware.errorHandler)

module.exports = app