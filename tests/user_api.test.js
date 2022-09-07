const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const app = require('../app')
const supertest = require('supertest')

const api = supertest(app)

const initialUsers = [
    {
        username: "albero03",
        name: "Albero Rossi",
        password: "password123"
    },
    {
        username: "ujusmith12",
        name: "Uju Smith",
        password: "password456"
    }
]

beforeEach(async () => {
    await User.deleteMany({})

    const userObjects = initialUsers.map(u => new User({
        username: u.username,
        name: u.name,
        password: bcrypt.hash(u.password, 10)
    }))

    const promiseArray = userObjects.map(u => u.save())

    await Promise.all(promiseArray)
}, 20000)

describe('addition of a user', () => {
    test('succeeds with valid data', async () => {
        const newUser = {
            username: "someusername",
            name: "Some Full Name",
            password: "somepassword"
        }

        await api.post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/users')
        const usernames = response.body.map(u => u.username)

        expect(response.body).toHaveLength(initialUsers.length + 1)
        expect(usernames).toContain(newUser.username)
    })

    describe('fails with appropriate status code and message if', () => {
        test('username is invalid', async () => {
            const noUsername = {
                name: 'Some Full Name',
                password: 'somepassword',
            }

            const shortUsername = {
                username: 'ab',
                name: 'Some Full Name',
                password: 'somepassword',
            }

            const existingUsername = {
                username: 'albero03',
                name: 'Some Full Name',
                password: 'somepassword',
            }

            let result = await api
                .post('/api/users')
                .send(noUsername)
                .expect(400)

            expect(result.body.error).toContain('username missing')

            result = await api
                .post('/api/users')
                .send(shortUsername)
                .expect(400)

            expect(result.body.error).toContain('username shorter than 3 characters')

            result = await api
                .post('/api/users')
                .send(existingUsername)
                .expect(400)

            expect(result.body.error).toContain('username must be unique')

            const response = await api.get('/api/users')
            expect(response.body).toHaveLength(initialUsers.length)
        })

        test('password is invalid', async () => {
            const noPassword = {
                username: 'someusername',
                name: 'Some Full Name',
            }

            const shortPassword = {
                username: 'someusername',
                name: 'Some Full Name',
                password: 'ab'
            }

            let result = await api
                .post('/api/users')
                .send(noPassword)
                .expect(400)

            expect(result.body.error).toContain('password missing')

            result = await api
                .post('/api/users')
                .send(shortPassword)
                .expect(400)

            expect(result.body.error).toContain('password shorter than 3 characters')

            const response = await api.get('/api/users')
            expect(response.body).toHaveLength(initialUsers.length)
        })
    })
})

afterAll(() => {
    mongoose.connection.close()
})