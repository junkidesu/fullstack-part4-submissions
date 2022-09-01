const logger = require('./logger')

const errorHandler = (error, request, response, next) => {
    logger.error(error.message)

    if (error.name === "ValidationError") {
        response.status(400).send({ error: error.message })
    } else if (error.name === "CastError") {
        response.status(400).send({ error: "malformatted id" })
    }

    next(error)
}

module.exports = {
    errorHandler
}