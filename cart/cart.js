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

const raiseError = (error, ctx) => http.reply(500)
    .enableCors()
    .jsonContent({ message: 'oh my...', error: error })
    .push(ctx.callback)

const raiseBadRequest = (error, ctx) => http.reply(400)
    .enableCors()
    .jsonContent({ error: error })
    .push(ctx.callback)

const raiseNoContent = ctx => http.reply(204)
    .enableCors()
    .push(ctx.callback)

const raiseNotFound = ctx => http.reply(404)
    .enableCors()
    .push(ctx.callback)

const parseBody = ctx => {
    return {
        then: (ok, ko) => {
            try {
                const json = JSON.parse(ctx.event.body)
                return ok(json, ctx)
            } catch (e) {
                return ko(e, ctx)
            }
        }
    }
}

module.exports.create = (event, context, callback) => {
    const ctx = {
        event: event,
        callback: callback
    }
    const id = guid.generate()
    const reply = ctx => data => http.reply(201)
        .location(`${baseUrl(event)}carts/${id}`)
        .enableCors()
        .push(ctx.callback)
    cart.create(id)
        .then(reply(ctx))
        .catch(error => raiseError(error, ctx))
}

module.exports.delete = (event, context, callback) => {
    const ctx = {
        event: event,
        callback: callback
    }
    const handleResult = (data, ctx) => data._old
        ? raiseNoContent(ctx)
        : raiseNotFound(ctx)
    cart.delete(event.pathParameters.id)
        .then(data => handleResult(data, ctx))
        .catch(error => raiseError(error, ctx))
}

module.exports.add = (event, context, callback) => {
    const ctx = {
        event: event,
        callback: callback
    }
    const id = event.pathParameters.item_id
    const validate = ctx => {
        return {
            then: (ok, ko) => inspect.ifUnmodifiedSince(ctx.event.headers)
            ? ok(ctx)
            : ko(ctx)
        }
    }
    const raiseCreated = ctx => http.reply(201)
        .enableCors()
        .push(ctx.callback)
    const raiseForbidden = ctx => http.reply(403)
        .enableCors()
        .jsonContent({ message: 'you need to provide "If-Modified-Since" in order to update' })
        .push(ctx.callback)
    const raisePreconditionFailed = ctx => http.reply(412)
        .enableCors()
        .jsonContent({ message: 'optimistic concurrency violation occurred' })
        .push(ctx.callback)
    const handleResult = (data, ctx) => data._new
        ? (data._old ? raiseNoContent(ctx) : raiseCreated(ctx))
        : raisePreconditionFailed(ctx)
    const add = (content, ctx) => {
        content.id = ctx.event.pathParameters.item_id
        return cart.add(ctx.event.pathParameters.id,
            inspect.ifUnmodifiedSince(ctx.event.headers),
            content)
            .then(data => handleResult(data, ctx))
            .catch(error => raiseError(error, ctx))
    }
    validate(ctx).then(ctx => parseBody(ctx)
        .then((content, ctx) => add(content, ctx), raiseBadRequest),
              raiseForbidden)
}

module.exports.remove = (event, context, callback) => {
    const ctx = {
        event: event,
        callback: callback
    }
    const handleResult = (data, ctx) => data._old
        ? raiseNoContent(ctx)
        : raiseNotFound(ctx)
    cart.remove(event.pathParameters.id,
        event.pathParameters.item_id)
        .then(data => handleResult(data, ctx))
        .catch(error => raiseError(error, ctx))
}

module.exports.get = (event, context, callback) => {
    const ctx = {
        event: event,
        callback: callback
    }
    const etag = lastUpdate => http.computeEtag(new Date(lastUpdate).toString())
    const reply = (statusCode, data) =>
        http.reply(statusCode)
            .lastModified(data.last_update)
            .etag(etag(data.last_update))
            .enableCors()
    const handleResult = (data, ctx) =>
        utils.empty(data)
            ? raiseNotFound(ctx)
            : inspect.handleConditionalRequest(ctx.event.headers,
                etag(data.last_update),
                data.last_update)(
                    data => reply(304, data).push(ctx.callback),
                    data => reply(200, data).jsonContent(data).push(ctx.callback))(data)
    cart.get(event.pathParameters.id)
        .then(data => handleResult(data, ctx))
        .catch(error => raiseError(error, ctx))
}

