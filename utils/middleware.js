const logger = require('./logger')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const errorHandler = (error, request, response, next) => {
    logger.error(error.message)

    if (error.name === "ValidationError") {
        response.status(400).send({ error: error.message })
    } else if (error.name === "CastError") {
        response.status(400).send({ error: "malformatted id" })
    } else if (error.name === 'JsonWebTokenError') {
        response.status(401).send({ error: 'invalid token' })
    }

    next(error)
}

const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')

    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        request.token = authorization.substring(7)
    }

    next()
}

const userExtractor = async (request, response, next) => {
    const token = request.token

    if (token) {
        const decodedToken = jwt.verify(token, process.env.SECRET)
        request.user = await User.findById(decodedToken.id)
    }

    next()
}

module.exports = {
    errorHandler,
    tokenExtractor,
    userExtractor
}