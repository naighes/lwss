'use strict'

const http = require('../lib/http')
const db = require('../lib/cart.db')
const guid = require('../lib/guid')

const baseUrl = (event) => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const raiseError = (error) => {
    return http.reply(500)
        .enableCors()
        .jsonContent({ message: 'oh my...', error: error })
}

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
    db.create(id)
        .then(data => {
            http.reply(201)
                .location(`${baseUrl(event)}carts/${id}`)
                .enableCors()
                .push(callback)
        })
        .catch(error => {
            raiseError(error).push(callback)
        })
}

module.exports.delete = (event, context, callback) => {
    db.delete(event.pathParameters.id)
        .then(data => {
            http.reply(204)
                .enableCors()
                .push(callback)
        })
        .catch(error => {
            raiseError(error).push(callback)
        })
}

module.exports.add = (event, context, callback) => {
    parseBody(event.body,
        content => {
            db.add(event.pathParameters.id,
                event.pathParameters.item_id,
                content)
                .then(data => {
                    http.reply(204)
                        .enableCors()
                        .push(callback)
                })
                .catch(error => {
                    raiseError(error).push(callback)
                })
        },
        error => { http.reply(400).enableCors().push(callback) })
}

module.exports.remove = (event, context, callback) => {
    db.remove(event.pathParameters.id,
        event.pathParameters.item_id)
        .then(data => {
            http.reply(204)
                .enableCors()
                .push(callback)
        })
        .catch(error => {
            raiseError(error).push(callback)
        })
}

module.exports.get = (event, context, callback) => {
    const handleResult = (data) => {
        if (Object.keys(data).length === 0) {
            http.reply(404)
                .enableCors()
                .push(callback)
        } else {
            http.reply(200)
                .lastModified(new Date(data.Item.last_update))
                .jsonContent({
                    rows: data.Item.rows
                })
                .enableCors()
                .push(callback)
        }
    }

    db.get(event.pathParameters.id)
        .then(data => {
            handleResult(data)
        })
        .catch(error => {
            raiseError(error).push(callback)
        })
}

