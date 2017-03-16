'use strict'

const http = require('../lib/http')
const cart = require('../lib/cart.db')
const guid = require('../lib/guid')

const baseUrl = event => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const raiseError = error => http.reply(500)
    .enableCors()
    .jsonContent({ message: 'oh my...', error: error })

const raiseBadRequest = error => http.reply(400)
    .enableCors()
    .jsonContent({ error: error })

const raiseNoContent = () => http.reply(204).enableCors()

const raiseNotFound = () => http.reply(404).enableCors()

const parseBody = (body, onSuccess, onError) => {
    try {
        const json = JSON.parse(body)
        onSuccess(json)
    } catch (e) {
        onError(e)
    }
}

module.exports.create = (event, context, callback) => {
    const id = guid.generate()
    cart.create(id)
        .then(data => http.reply(201)
            .location(`${baseUrl(event)}carts/${id}`)
            .enableCors()
            .push(callback))
        .catch(error => raiseError(error).push(callback))
}

// TODO: return 404 on item not found
module.exports.delete = (event, context, callback) =>
    cart.delete(event.pathParameters.id)
        .then(data => raiseNoContent().push(callback))
        .catch(error => raiseError(error).push(callback))

// TODO: return 201 on creation
module.exports.add = (event, context, callback) =>
    parseBody(event.body,
        content => {
            content.id = event.pathParameters.item_id
            cart.add(event.pathParameters.id, content)
                .then(data => raiseNoContent().push(callback))
                .catch(error => raiseError(error).push(callback))
        },
        error => raiseBadRequest(error).push(callback))

// TODO: return 404 on item not found
module.exports.remove = (event, context, callback) =>
    cart.remove(event.pathParameters.id,
        event.pathParameters.item_id)
        .then(data => raiseNoContent().push(callback))
        .catch(error => raiseError(error).push(callback))

module.exports.get = (event, context, callback) => {
    const handleResult = data => {
        if (Object.keys(data).length === 0) {
            raiseNotFound().push(callback)
        } else {
            http.reply(200)
                .lastModified(new Date(data.last_update))
                .jsonContent(data)
                .enableCors()
                .push(callback)
        }
    }

    cart.get(event.pathParameters.id)
        .then(data => handleResult(data))
        .catch(error => raiseError(error)
            .push(callback))
}

