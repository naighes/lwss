'use strict'

const http = require('../lib/http')
const guid = require('../lib/guid')
const AWS = require('aws-sdk')

const paramsForCreate = (table, id, now) => {
    return {
        TableName : table,
        Item: {
            cart_id: id,
            last_update: now(),
            rows: { }
        }
    }
}

const paramsForDelete = (table, id) => {
    return {
        Key: { cart_id: id },
        TableName : table
    }
}

const paramsForAdd = (table, id, itemId, now, item) => {
    return {
        Key: { cart_id: id },
        TableName: table,
        UpdateExpression: 'SET #R.#item_id = :node, last_update = :last_update',
        ExpressionAttributeNames: { '#item_id' : itemId, '#R': 'rows' },
        ExpressionAttributeValues: {
            ':last_update': now(),
            ':node' : {
                description: item.description,
                price: item.price,
                quantity: item.quantity,
                thumb_url: item.thumb_url
            }
        }
    }
}

const paramsForRemove = (table, id, itemId, now) => {
    return {
        Key: { cart_id: id },
        TableName: table,
        UpdateExpression: 'REMOVE #R.#item_id SET last_update = :last_update',
        ExpressionAttributeNames: { '#item_id' : itemId, '#R': 'rows' },
        ExpressionAttributeValues: {
            ':last_update': now()
        }
    }
}

const paramsForGet = (table, id) => {
    return {
        TableName: table,
        Key: { cart_id: id }
    }
}

const baseUrl = (event) => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const now = () => {
    return new Date().getTime()
}

const tableName = () => {
    return process.env.CART_TABLE_NAME
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
    const db = new AWS.DynamoDB.DocumentClient()
    const id = guid.generate()
    db.put(paramsForCreate(tableName(), id, now), (error, data) => {
        if (error) {
            raiseError(error).push(callback)
        } else {
            http.reply(201)
                .location(`${baseUrl(event)}carts/${id}`)
                .enableCors()
                .push(callback)
        }
    })
}

module.exports.delete = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient()
    db.delete(paramsForDelete(tableName(),
        event.pathParameters.id),
        (error, data) => {
            if (error) {
                raiseError(error).push(callback)
            } else {
                http.reply(204)
                    .enableCors()
                    .push(callback)
            }
        })
}

module.exports.add = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient()
    parseBody(event.body,
        (content) => {
            db.update(paramsForAdd(tableName(),
                event.pathParameters.id,
                event.pathParameters.item_id,
                now,
                content), (error, data) => {
                    if (error) {
                        raiseError(error).push(callback)
                    } else {
                        http.reply(204)
                            .enableCors()
                            .push(callback)
                    }
                })
        },
        (error) => { http.reply(400).enableCors().push(callback) })
}

module.exports.remove = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient()
    db.update(paramsForRemove(tableName(),
        event.pathParameters.id,
        event.pathParameters.item_id,
        now), (error, data) => {
            if (error) {
                raiseError(error).push(callback)
            } else {
                http.reply(204)
                    .enableCors()
                    .push(callback)
            }
        })
}

module.exports.get = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient()
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

    db.get(paramsForGet(tableName(),
        event.pathParameters.id), (error, data) => {
            if (error) {
                raiseError(error).push(callback)
            } else {
                handleResult(data)
            }
        })
}

