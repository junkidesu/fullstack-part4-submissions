require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const blogsRouter = require('./constollers/blogs')
const mongoose = require('mongoose')

const mongoUrl = process.env.MONGODB_URI

console.log('connecting to', process.env.MONGODB_URI)

mongoose.connect(mongoUrl)
    .then(() => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.error('error connecting to MongoDB:', error.message)
    })

app.use(cors())
app.use(express.json())

app.use('/api/blogs', blogsRouter)

module.exports = app