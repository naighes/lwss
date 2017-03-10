'use strict'

const http = require('../lib/http')
const guid = require('../lib/guid')
const AWS = require('aws-sdk')
const Validator = require('jsonschema').Validator

const paramsForCreate = (table, id, cart, now) => {
    return {
        TableName : table,
        Item: {
            order_id: id,
            cart: cart,
            last_update: now()
        }
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
    return process.env.ORDER_TABLE_NAME
}

const raiseError = (error) => {
    return http.reply(500)
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

const validateOrder = (content, onSuccess, onError) => {
    var schema = {
        "type": "object",
        "properties": {
            "cart_id": {
                "type": "string",
                "required": true
            },
            "rows": {
                "type": "object",
                "required": true,
                "minProperties": 1
            },
            "email": {
                "type": "string",
                "required": true
            }
        }
    }

    var v = new Validator()
    var result = v.validate(content, schema)

    if (result.errors.length > 0) {
        onError(result.errors.map((value) => {
            return {
                property: value.property,
                message: value.message
            }
        }))
    } else {
        onSuccess(content)
    }
}

module.exports.create = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient()
    const id = guid.generate()
    const raisePut = (content) => {
        db.put(paramsForCreate(tableName(), id, content, now),
            (error, data) => {
                if (error) {
                    raiseError(error).push(callback)
                } else {
                    http.reply(201)
                        .location(`${baseUrl(event)}orders/${id}`)
                        .enableCors()
                        .push(callback)
                }
            })
    }
    const validate = (content) => {
        validateOrder(content,
            raisePut,
            (errors) => {
                http.reply(422)
                    .jsonContent(errors)
                    .push(callback)
            })
    }
    parseBody(event.body,
        validate,
        (error) => { http.reply(400).push(callback) })
}

