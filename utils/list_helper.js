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

    const max = Math.max(blogs.map(b => b.likes))
    return blogs.find(b => b.likes === max)
}

module.exports = {
    dummy, totalLikes, favoriteBlog
}