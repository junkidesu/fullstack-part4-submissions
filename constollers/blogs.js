const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
    if (!request.user) {
        return response.status(401).json({
            error: 'token missing or invalid'
        })
    }

    const user = request.user
    const body = request.body

    const blog = new Blog({
        ...body,
        likes: body.likes || 0,
        user: user._id
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    await savedBlog.populate('user', { username: 1, name: 1 })

    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response, next) => {
    if (!request.user) {
        return response.status(401).json({
            error: 'token missing or invalid'
        })
    }

    const user = request.user
    const blog = await Blog.findById(request.params.id)

    if (!blog) {
        return response.status(204).end()
    }

    if (blog.user.toString() !== request.user.id) {
        return response.status(401).send({
            error: 'a blog can be deleted only by its creator'
        })
    }

    user.blogs = user.blogs.filter(b => b._id !== request.params.id)
    await user.save()

    await Blog.findByIdAndDelete(request.params.id)

    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = { ...request.body }

    if (!body.title) {
        return response.status(400).send({ error: "title missing" })
    }

    if (!body.url) {
        return response.status(400).send({ error: "url missing" })
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        request.params.id,
        { ...body, user: body.user.id },
        { new: true, runValidators: true, context: 'query' }
    ).populate('user', { username: 1, name: 1 })

    response.json(updatedBlog)
})

module.exports = blogsRouter