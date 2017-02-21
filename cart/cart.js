'use strict';

const fit = require('../lib/fluent-fit')
const http = require('../lib/http')
const guid = require('../lib/guid')
const AWS = require('aws-sdk');

const invalidContent = () => {
    return http.reply(400)
        .jsonContent({
            message: 'it looks like you sent invalid content for application/json media type'
        })
        .getResponse()
}

const paramsForPut = (table, id, now) => {
    return {
        TableName : table,
        Item: {
            cart_id: id,
            last_update: now(),
            rows: { }
        }
    };
}

const paramsForAdd = (table, id, item_id, now, item) => {
    return {
        Key: { cart_id: id },
        TableName: table,
        UpdateExpression: 'SET #R.#item_id = :node, last_update = :last_update',
        ExpressionAttributeNames: { '#item_id' : item_id, '#R': 'rows' },
        ExpressionAttributeValues: {
            ':last_update': now(),
            ':node' : {
                description: item.description,
                price: item.price,
                quantity: item.quantity
            }
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
    return process.env.TABLE_NAME
}

module.exports.create = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const id = guid.generate()
    db.put(paramsForPut(tableName(), id, now), (error, data) => {
        if (error) {
            callback(null, http.reply(500)
                .jsonContent({ message: 'oh my...', error: error })
                .getResponse())
        } else {
            callback(null, http.reply(201)
                .location(`${baseUrl(event)}carts/${id}`)
                .getResponse())
        }
    })
}

module.exports.add = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const body = JSON.parse(event.body)
    db.update(paramsForAdd(tableName(),
        event.pathParameters.id,
        event.pathParameters.item_id,
        now,
        body), (error, data) => {
            if (error) {
                callback(null, http.reply(500)
                    .jsonContent({ message: 'oh my...', error: error })
                    .getResponse())
            } else {
                callback(null, http.reply(204)
                    .getResponse())
            }
        })
}

module.exports.get = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const handleResult = (data) => {
        if (Object.keys(data).length === 0) {
            callback(null, http.reply(404)
                .getResponse())
        } else {
            callback(null, http.reply(200)
                .lastModified(new Date(data.last_update))
                .jsonContent({
                    rows: data.rows
                })
                .getResponse())
        }
    }

    db.get(paramsForGet(tableName(),
        event.pathParameters.id), (error, data) => {
            if (error) {
                callback(null, http.reply(500)
                    .jsonContent({ message: 'oh my...', error: error })
                    .getResponse())
            } else {
                handleResult(data)
            }
        })
}

