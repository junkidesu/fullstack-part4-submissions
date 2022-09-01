const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map(b => new Blog(b))

    const promiseArray = blogObjects.map(b => b.save())
    await Promise.all(promiseArray)
}, 20000)

describe('when there are initially some notes saved', () => {
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
})

describe('addition of a new blog', () => {
    test('succeeds with valid data', async () => {
        const newBlog = {
            title: "Title",
            author: "Author",
            url: "url",
            likes: 0
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
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
        const blogWithoutLikes = {
            title: "Title",
            author: "Author",
            url: "url"
        }

        await api.post('/api/blogs')
            .send(blogWithoutLikes)

        const blogs = await helper.blogsInDb()

        const savedBlog = blogs.find(b => b.title === blogWithoutLikes.title)

        expect(savedBlog.likes).toBeDefined()
        expect(savedBlog.likes).toBe(0)
    })

    test('results in error with status code 400 if data invalid', async () => {
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
            .expect(400)

        await api
            .post('/api/blogs')
            .send(blogWithoutUrl)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deletion of a blog', () => {
    test('succeeds if the blog is in the DB', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blog = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blog.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
        expect(blogsAtEnd.find(b => b.id === blog.id)).toBeUndefined()
    })

    test('does not fail if the blog is not in the DB', async () => {
        const blogs = await helper.blogsInDb()
        const blog = blogs[0]

        await api.delete(`/api/blogs/${blog.id}`)

        await api
            .delete(`/api/blogs/${blog.id}`)
            .expect(204)
    })
    
    test('sends an error with status code 400 if id malformatted', async () => {
        await api
            .delete('/api/blogs/malformatted_id')
            .expect(400)
    })
})

afterAll(() => {
    mongoose.connection.close()
})