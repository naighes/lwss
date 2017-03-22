'use strict'

const http = require('../lib/http')
const inspect = http.inspect()
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

const parseBody = body => {
    return {
        then: (ok, ko) => {
            try {
                const json = JSON.parse(body)
                ok(json)
            } catch (e) {
                ko(e)
            }
        }
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

module.exports.delete = (event, context, callback) => {
    const handleResult = data => data._old
        ? raiseNoContent()
        : raiseNotFound()
    cart.delete(event.pathParameters.id)
        .then(data => handleResult(data)(callback))
        .catch(error => raiseError(error)(callback))
}

// TODO: handle optimistic concurrency by conditional request
module.exports.add = (event, context, callback) => {
    const validate = (headers, ok, ko) => inspect.ifUnmodifiedSince(headers) ? ok() : ko()
    const raiseForbidden = http.reply(403)
        .enableCors()
        .jsonContent({ message: 'you need to provide "If-Modified-Since" in order to update' })
        .push
    const raisePreconditionFailed = () => http.reply(412)
        .enableCors()
        .jsonContent({ message: 'optimistic concurrency violation occurred' })
        .push
    const handleResult = data => data._new
        ? (data._old ? raiseNoContent() : http.reply(201).enableCors().push)
        : raisePreconditionFailed()
    validate(event.headers,
        () => parseBody(event.body)
        .then(content => {
            content.id = event.pathParameters.item_id
            cart.add(event.pathParameters.id,
                inspect.ifUnmodifiedSince(event.headers),
                content)
                .then(data => handleResult(data, content.id)(callback))
                .catch(error => raiseError(error)(callback))
        },
            error => raiseBadRequest(error)(callback)),
        () => raiseForbidden(callback))
}

module.exports.remove = (event, context, callback) => {
    const handleResult = data => data._old
        ? raiseNoContent()
        : raiseNotFound()
    cart.remove(event.pathParameters.id,
        event.pathParameters.item_id)
        .then(data => handleResult(data)(callback))
        .catch(error => raiseError(error)(callback))
}

module.exports.get = (event, context, callback) => {
    const etag = lastUpdate => http.computeEtag(new Date(lastUpdate).toString())
    const reply = (statusCode, data) =>
        http.reply(statusCode)
            .lastModified(new Date(data.last_update))
            .etag(etag(data.last_update))
            .enableCors()
    const handleResult = (data, headers) =>
        utils.empty(data)
            ? raiseNotFound()
            : inspect.handleConditionalRequest(headers,
                etag(data.last_update),
                new Date(data.last_update))(
                    data => reply(304, data),
                    data => reply(200, data).jsonContent(data))(data).push
    cart.get(event.pathParameters.id)
        .then(data => handleResult(data, event.headers)(callback))
        .catch(error => raiseError(error)(callback))
}

