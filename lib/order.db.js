'use strict'

const AWS = require('aws-sdk')

const paramsForCreate = (table, id, cart, now) => {
    return {
        TableName : table,
        Item: {
            id: id,
            cart: cart,
            last_update: now()
        }
    }
}

const now = () => {
    return Date.now() / 1000 | 0
}

const tableName = () => {
    return process.env.ORDER_TABLE_NAME
}

module.exports.create = (id, cart) => {
    const db = new AWS.DynamoDB.DocumentClient()

    return new Promise((resolve, reject) => {
        db.put(paramsForCreate(tableName(), id, cart, now),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
    })
}

