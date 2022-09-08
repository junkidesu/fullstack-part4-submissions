const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})

    const user = new User({
        username: 'username',
        name: 'Full Name',
        passwordHash: await bcrypt.hash('password', 10)
    })

    const anotherUser = new User({
        username: 'anotherusername',
        name: 'Another Full Name',
        passwordHash: await bcrypt.hash('anotherpassword', 10)
    })

    await user.save()
    await anotherUser.save()

    const blogObjects = helper.initialBlogs.map(b => new Blog({ ...b, user: user._id }))

    const promiseArray = blogObjects.map(b => b.save())
    await Promise.all(promiseArray)

    user.blogs = blogObjects.map(b => b._id)

    await user.save()
}, 20000)

describe('for all users', () => {
    describe('when there are initially some blogs saved', () => {
        test('correct number of blogs is returned in JSON format', async () => {
            await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)

            const response = await api.get('/api/blogs')

            expect(response.body).toHaveLength(6)
        })

        test('identifier of a blog is named id', async () => {
            const response = await api.get('/api/blogs')

            expect(response.body[0].id).toBeDefined()
        })

        test('a blog has information about who added it', async () => {
            const response = await api.get('/api/blogs')

            expect(response.body[0].user).toBeDefined()
        })
    })
})

const login = async (userData) => {
    const response = await api
        .post('/api/login')
        .send(userData)

    return response.body.token
}

describe('addition of a blog', () => {
    describe('if user logged in', () => {
        test('succeeds with valid data', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            const newBlog = {
                title: "Title",
                author: "Author",
                url: "url",
                likes: 0
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .set('Authorization', `bearer ${token}`)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            const blogs = blogsAtEnd.map(b => {
                return {
                    title: b.title,
                    author: b.author,
                    url: b.url,
                    likes: b.likes
                }
            })

            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
            expect(blogs).toContainEqual(newBlog)
        })

        test('defaults the property likes to 0 if missing', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            const blogWithoutLikes = {
                title: "Title",
                author: "Author",
                url: "url"
            }

            await api.post('/api/blogs')
                .send(blogWithoutLikes)
                .set('Authorization', `bearer ${token}`)

            const blogs = await helper.blogsInDb()

            const savedBlog = blogs.find(b => b.title === blogWithoutLikes.title)

            expect(savedBlog.likes).toBeDefined()
            expect(savedBlog.likes).toBe(0)
        })

        test('results in error with status code 400 if data invalid', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            const blogWithoutTitle = {
                author: "Author",
                url: "url",
                likes: 10
            }

            const blogWithoutUrl = {
                title: "Title",
                author: "Author",
                likes: 10
            }

            await api
                .post('/api/blogs')
                .send(blogWithoutTitle)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

            await api
                .post('/api/blogs')
                .send(blogWithoutUrl)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()

            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })
    })

    test('if a token not provided, fails with appropriate status code', async () => {
        const newBlog = {
            title: "Title",
            author: "Author",
            url: "url",
            likes: 0
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deletion of a blog', () => {
    describe('if user logged in', () => {
        test('succeeds if the blog is in the DB', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            const blogsAtStart = await helper.blogsInDb()
            const blog = blogsAtStart[0]

            await api
                .delete(`/api/blogs/${blog.id}`)
                .set('Authorization', `bearer ${token}`)
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()

            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
            expect(blogsAtEnd.find(b => b.id === blog.id)).toBeUndefined()
        })

        test('sends an error with status code 400 if id malformatted', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            await api
                .delete('/api/blogs/malformatted_id')
                .set('Authorization', `bearer ${token}`)
                .expect(400)
        })

        test('does not fail if blog non existing', async () => {
            const token = await login({
                username: 'username',
                password: 'password'
            })

            const blogs = await helper.blogsInDb()
            const blog = blogs[0]

            await api
                .delete(`/api/blogs/${blog.id.toString()}`)
                .set('Authorization', `bearer ${token}`)

            await api
                .delete(`/api/blogs/${blog.id.toString()}`)
                .set('Authorization', `bearer ${token}`)
                .expect(204)
        })
    })

    test('fails with appropriate code if token not provided', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blog = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blog.id}`)
            .expect(401)
    })

    test('fails with suitable code and message if not done by creator', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blog = blogsAtStart[0] //we can safely take the first blog because another user has no blogs

        const token = await login({
            username: 'anotherusername',
            password: 'anotherpassword'
        })

        const response = await api
            .delete(`/api/blogs/${blog.id.toString()}`)
            .set('Authorization', `bearer ${token}`)
            .expect(401)

        expect(response.body.error).toContain('a blog can be deleted only by its creator')
    })
})

describe('updating an existing blog', () => {
    test('succeeds with valid data', async () => {
        const blogs = await helper.blogsInDb()
        const blog = blogs[0]

        const changedBlog = {
            title: blog.title,
            author: blog.author,
            url: blog.url,
            likes: blog.likes + 10
        }

        await api
            .put(`/api/blogs/${blog.id.toString()}`)
            .send(changedBlog)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()

        const updatedBlog = blogsAtEnd
            .find(b => b.id.toString() === blog.id.toString())

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        expect(updatedBlog.likes).toBe(blog.likes + 10)
    })

    test('fails with status code 400 if data invalid', async () => {
        const blogs = await helper.blogsInDb()
        const blog = blogs[0]

        const blogWithoutTitle = {
            author: blog.author,
            url: blog.url,
            likes: blog.likes + 10
        }

        const blogWithoutUrl = {
            title: blog.title,
            author: blog.author,
            likes: blog.likes + 10
        }

        await api
            .put(`/api/blogs/${blog.id.toString()}`)
            .send(blogWithoutTitle)
            .expect(400)

        await api
            .put(`/api/blogs/${blog.id.toString()}`)
            .send(blogWithoutUrl)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()

        const updatedBlog = blogsAtEnd
            .find(b => b.id.toString() === blog.id.toString())

        expect(updatedBlog.likes).toBe(blog.likes)
    })

    test('fails with status code 400 if id malformatted', async () => {
        const blogs = await helper.blogsInDb()
        const blog = blogs[0]

        const changedBlog = {
            title: blog.title,
            author: blog.author,
            url: blog.url,
            likes: blog.likes + 10
        }

        await api
            .put(`/api/blogs/malformatted_id`)
            .send(changedBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()

        const updatedBlog = blogsAtEnd
            .find(b => b.id.toString() === blog.id.toString())

        expect(updatedBlog.likes).toBe(blog.likes)
    })
})

afterAll(() => {
    mongoose.connection.close()
})