const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User.find({})
    response.json(users)
})

usersRouter.post('/', async (request, response, next) => {
    try {
        const { username, name, password } = request.body

        const foundUser = await User.findOne({ username })

        if (foundUser) {
            return response.status(400).send({ error: "username must be unique" })
        }

        if (!password) {
            return response.status(400).send({ error: "password missing" })
        }

        if (password.length < 3) {
            return response.status(400).send({ error: "password shorter than 3 characters" })
        }

        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const user = new User({
            username,
            name,
            passwordHash,
        })

        const savedUser = await user.save()

        response.status(201).json(savedUser)
    } catch (error) {
        next(error)
    }
})

module.exports = usersRouter