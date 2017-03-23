'use strict'

const AWS = require('aws-sdk')
const utils = require('./utils')

const paramsForCreate = (table, id, now) => {
    return {
        TableName : table,
        Item: {
            id: id,
            last_update: now(),
            rows: { }
        }
    }
}

const paramsForDelete = (table, id) => {
    return {
        Key: { id: id },
        TableName : table,
        ReturnValues: 'ALL_OLD'
    }
}

const paramsForAdd = params => {
    return {
        Key: { id: params.id },
        TableName: params.table,
        UpdateExpression: 'SET #R.#item_id = :node, last_update = :last_update',
        ExpressionAttributeNames: { '#item_id' : params.item.id, '#R': 'rows' },
        ExpressionAttributeValues: {
            ':last_update': params.now(),
            ':if_unmodified_since': params.ifUnmodifiedSince,
            ':node' : {
                description: params.item.description,
                price: params.item.price,
                quantity: params.item.quantity,
                thumb_url: params.item.thumb_url
            }
        },
        ConditionExpression: 'last_update <= :if_unmodified_since',
        ReturnValues: 'UPDATED_OLD'
    }
}

const paramsForRemove = (table, id, itemId, now) => {
    return {
        Key: { id: id },
        TableName: table,
        UpdateExpression: 'REMOVE #R.#item_id SET last_update = :last_update',
        ExpressionAttributeNames: { '#item_id' : itemId, '#R': 'rows' },
        ExpressionAttributeValues: {
            ':last_update': now()
        },
        ReturnValues: 'UPDATED_OLD'
    }
}

const paramsForGet = (table, id) => {
    return {
        TableName: table,
        Key: { id: id }
    }
}

const now = () => {
    return Date.now() / 1000 | 0
}

const tableName = () => process.env.CART_TABLE_NAME

module.exports.create = id => {
    const db = new AWS.DynamoDB.DocumentClient()

    return new Promise((resolve, reject) => {
        const handleResult = (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        }
        db.put(paramsForCreate(tableName(), id, now),
            handleResult)
    })
}

module.exports.delete = id => {
    const db = new AWS.DynamoDB.DocumentClient()
    const deleted = (data, id) =>
        utils.notEmpty(data) &&
            data.hasOwnProperty('Attributes') &&
            data.Attributes.hasOwnProperty('id')

    return new Promise((resolve, reject) => {
        const handleResult = (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve({
                    _old: deleted(data, id)
                    ? data.Attributes
                    : null
                })
            }
        }
        db.delete(paramsForDelete(tableName(), id),
            handleResult)
    })
}

module.exports.add = (id, ifUnmodifiedSince, item) => {
    const db = new AWS.DynamoDB.DocumentClient()
    const changed = (data, id) =>
        utils.notEmpty(data) &&
            data.hasOwnProperty('Attributes') &&
            data.Attributes.hasOwnProperty('rows') &&
            data.Attributes.rows.hasOwnProperty(id)

    return new Promise((resolve, reject) => {
        const handleError = error => {
            if (error.code === 'ConditionalCheckFailedException') {
                resolve({ })
            } else {
                reject(error)
            }
        }
        const handleResult = (error, data) => {
            if (error) {
                handleError(error)
            } else {
                resolve({
                    _old: changed(data, item.id) ? data.Attributes.rows[item.id] : null,
                    _new: item
                })
            }
        }
        db.update(paramsForAdd({
            table: tableName(),
            id: id,
            item: item,
            now: now,
            ifUnmodifiedSince: ifUnmodifiedSince
        }), handleResult)
    })
}

module.exports.remove = (id, itemId) => {
    const db = new AWS.DynamoDB.DocumentClient()
    const deleted = (data, id) =>
        utils.notEmpty(data) &&
            data.hasOwnProperty('Attributes') &&
            data.Attributes.hasOwnProperty('rows') &&
            data.Attributes.rows.hasOwnProperty(id)

    return new Promise((resolve, reject) => {
        const handleResult = (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve({
                    _old: deleted(data, itemId)
                    ? data.Attributes.rows[itemId]
                    : null
                })
            }
        }
        db.update(paramsForRemove(tableName(), id, itemId, now),
            handleResult)
    })
}

module.exports.get = id => {
    const getResult = data => Object.keys(data).length === 0
        ? { }
        : data.Item
    const db = new AWS.DynamoDB.DocumentClient()

    return new Promise((resolve, reject) => {
        const handleResult = (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(getResult(data))
            }
        }
        db.get(paramsForGet(tableName(), id),
            handleResult)
    })
}

