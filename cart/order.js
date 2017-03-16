'use strict'

const http = require('../lib/http')
const db = require('../lib/order.db')
const guid = require('../lib/guid')
const Validator = require('jsonschema').Validator

const baseUrl = event => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

const raiseError = error => {
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

const validateOrder = (content, onSuccess, onError) => {
    var schema = {
        "type": "object",
        "properties": {
            "id": {
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

    const result = new Validator().validate(content, schema)

    if (result.errors.length > 0) {
        onError(result.errors.map(value => {
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
    const id = guid.generate()
    const raisePut = content => db.create(id, content)
        .then(result => http.reply(201)
            .location(`${baseUrl(event)}orders/${id}`)
            .enableCors()
            .push(callback))
        .catch(error => raiseError(error).push(callback))
    const validate = content => validateOrder(content,
        raisePut,
        errors => http.reply(422)
        .jsonContent(errors)
        .enableCors()
        .push(callback))
    parseBody(event.body,
        validate,
        error => http.reply(400)
        .enableCors()
        .push(callback))
}

