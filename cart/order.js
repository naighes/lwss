'use strict';

const http = require('../lib/http')
const guid = require('../lib/guid')
const AWS = require('aws-sdk');

// TODO: adding validation for order creation

const paramsForCreate = (table, id, content, now) => {
    return {
        TableName : table,
        Item: {
            order_id: id,
            content: content,
            last_update: now()
        }
    };
}

const baseUrl = (event) => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const now = () => {
    return new Date().getTime()
}

const tableName = () => {
    return process.env.ORDER_TABLE_NAME
}

const raiseError = (error) => {
    return http.reply(500)
        .jsonContent({ message: 'oh my...', error: error })
}

const parseBody = (body, onSuccess, onError) => {
    try {
        const json = JSON.parse(body)
        return onSuccess(json)
    } catch (e) {
        onError(e)
    }
}

module.exports.create = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const id = guid.generate()
    parseBody(event.body,
        (content) => {
            db.put(paramsForCreate(tableName(), id, content, now), (error, data) => {
                if (error) {
                    raiseError(error).push(callback)
                } else {
                    http.reply(201)
                        .location(`${baseUrl(event)}orders/${id}`)
                        .push(callback)
                }
            })
        },
        (error) => { http.reply(400).push(callback) })
}

