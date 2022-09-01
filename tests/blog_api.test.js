const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const Blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
    {
        title: "React patterns",
        author: "Michael Chan",
        url: "https://reactpatterns.com/",
        likes: 7
    },
    {
        title: "Go To Statement Considered Harmful",
        author: "Edsger W. Dijkstra",
        url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
        likes: 5
    },
    {
        title: "Canonical string reduction",
        author: "Edsger W. Dijkstra",
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
        likes: 12
    },
    {
        title: "First class tests",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
        likes: 10
    },
    {
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 0
    },
    {
        title: "Type wars",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = initialBlogs.map(b => new Blog(b))

    const promiseArray = blogObjects.map(b => b.save())
    await Promise.all(promiseArray)
}, 20000)

test('correct number of blogs is returned in JSON format', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(6)
})

test('blog identifier is named id', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
})

test('a valid blog can be added', async () => {
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

    const response = await api.get('/api/blogs')
    const blogs = response.body.map(b => {
        return {
            title: b.title,
            author: b.author,
            url: b.url,
            likes: b.likes
        }
    })

    expect(response.body).toHaveLength(initialBlogs.length + 1)
    expect(blogs).toContainEqual(newBlog)
})

test('if likes property is missed, it will default to 0', async () => {
    const blogWithoutLikes = {
        title: "Title",
        author: "Author",
        url: "url"
    }

    await api.post('/api/blogs')
        .send(blogWithoutLikes)
    
    const response = await api.get('/api/blogs')

    const savedBlog = response.body.find(b => b.title === blogWithoutLikes.title)

    expect(savedBlog.likes).toBeDefined()
    expect(savedBlog.likes).toBe(0)
})

test('if title or url are missing, backend responds with 400', async () => {
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
    
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(initialBlogs.length)
})

afterAll(() => {
    mongoose.connection.close()
})