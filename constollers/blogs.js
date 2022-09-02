const blogsRouter = require('express').Router()
const Blog = require('./../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})


blogsRouter.post('/', async (request, response, next) => {
    try {
        const body = request.body
        const blog = new Blog({
            ...body,
            likes: body.likes || 0
        })

        const savedBlog = await blog.save()
        response.status(201).json(savedBlog)
    } catch (error) {
        next(error)
    }
})

blogsRouter.delete('/:id', async (request, response, next) => {
    try {
        await Blog.findByIdAndDelete(request.params.id)
        response.status(204).end()
    } catch (error) {
        next(error)
    }
})

blogsRouter.put('/:id', async (request, response, next) => {
    try {
        const body = { ...request.body }

        if (!body.title) {
            return response.status(400).send({ error: "title missing" })
        }

        if (!body.url) {
            return response.status(400).send({ error: "url missing" })
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            request.params.id,
            body,
            { new: true, runValidators: true, context: 'query' }
        )

        response.json(updatedBlog)
    } catch (error) {
        next(error)
    }
})

module.exports = blogsRouter