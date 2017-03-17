'use strict'

const http = require('../lib/http')
const cart = require('../lib/cart.db')
const guid = require('../lib/guid')
const utils = require('../lib/utils')

const baseUrl = event => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const raiseError = error => http.reply(500)
    .enableCors()
    .jsonContent({ message: 'oh my...', error: error })
    .push

const raiseBadRequest = error => http.reply(400)
    .enableCors()
    .jsonContent({ error: error })
    .push

const raiseNoContent = () => http.reply(204).enableCors().push

const raiseNotFound = () => http.reply(404).enableCors().push

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
        .catch(error => raiseError(error)(callback))
}

// TODO: return 404 on item not found
module.exports.delete = (event, context, callback) =>
    cart.delete(event.pathParameters.id)
        .then(data => raiseNoContent()(callback))
        .catch(error => raiseError(error)(callback))

module.exports.add = (event, context, callback) => {
    const handleResult = data => data.oldRow
        ? raiseNoContent()
        : http.reply(201).enableCors().push // TODO: add location
    parseBody(event.body,
        content => {
            content.id = event.pathParameters.item_id
            cart.add(event.pathParameters.id, content)
                .then(data => handleResult(data, content.id)(callback))
                .catch(error => raiseError(error)(callback))
        },
        error => raiseBadRequest(error)(callback))
}

// TODO: return 404 on item not found
module.exports.remove = (event, context, callback) =>
    cart.remove(event.pathParameters.id,
        event.pathParameters.item_id)
        .then(data => raiseNoContent()(callback))
        .catch(error => raiseError(error)(callback))

module.exports.get = (event, context, callback) => {
    const handleResult = data => utils.empty(data)
        ? raiseNotFound()
        : http.reply(200)
        .lastModified(new Date(data.last_update))
        .jsonContent(data)
        .enableCors()
        .push
    cart.get(event.pathParameters.id)
        .then(data => handleResult(data)(callback))
        .catch(error => raiseError(error)(callback))
}

