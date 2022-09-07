const lodash = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.map(b => b.likes)
        .reduce((prev, curr) => prev + curr, 0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return null
    }

    let max = blogs[0].likes
    for (let i = 1; i < blogs.length; i++) {
        if (blogs[i].likes > max) {
            max = blogs[i].likes
        }
    }

    return blogs.find(b => b.likes === max)
}

const mostBlogs = blogs => {
    const blogsCount = lodash.map(
        lodash.countBy(blogs, 'author'),
        (value, key) => {
            return {
                author: key,
                blogs: value
            }
        }
    )

    return lodash.maxBy(blogsCount, b => b.blogs)
}

const mostLikes = blogs => {
    const likesCount = lodash.map(
        lodash.groupBy(blogs, 'author'),
        (value, key) => {
            const likes = lodash.reduce(
                lodash.map(value, b => b.likes),
                (p, c) => p + c
            )
            return {
                author: key,
                likes: likes
            }
        }
    )

    return lodash.maxBy(likesCount, l => l.likes)
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}