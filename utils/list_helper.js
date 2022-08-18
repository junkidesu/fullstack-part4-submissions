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

module.exports = {
    dummy, totalLikes, favoriteBlog
}