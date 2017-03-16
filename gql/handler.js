'use strict'

const graphqlModule = require('graphql')
const graphql = graphqlModule.graphql

const http = require('../lib/http')
const cart = require('../lib/cart.db')
const guid = require('../lib/guid')
const schema = require('./schema')

const parseBody = (body, onSuccess, onError) => {
    try {
        const json = JSON.parse(body)
        onSuccess(json)
    } catch (e) {
        onError(e)
    }
}

const getQuery = body => {
    let q = body

    if (q && q.hasOwnProperty('query')) {
        q = q.query.replace("\n", ' ', "g")
    }

    return q
}

const raiseError = error => {
    return http.reply(500)
        .enableCors()
        .jsonContent({ message: 'oh my...', error: error })
}

module.exports.handle = (event, context, callback) => {
    const onSuccess = body => graphql(schema.CartSchema,
        getQuery(body.query))
        .then(result => callback(null, result))
        .catch(error => raiseError(error)
            .push(callback))
    parseBody(event.body,
        onSuccess,
        error => raiseError(error)
        .push(callback))
}

