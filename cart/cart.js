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

const putParams = (table, id) => {
    return {
        TableName : table,
        Item: {
            cart_id: id,
            rows: []
        }
    };
}

const baseUrl = (event) => {
    const scheme = event.headers['X-Forwarded-Proto']
    return `${scheme}://${event.headers.Host}/${event.requestContext.stage}/`
}

module.exports.create = (event, context, callback) => {
    const db = new AWS.DynamoDB.DocumentClient();
    fit.perform(() => JSON.parse(event.body))
        .then((result) => {
            const id = guid.generate()
            db.put(putParams(process.env.TABLE_NAME, id), (error, data) => {
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
        }, (error) => {
            callback(null, invalidContent())
        })
};

