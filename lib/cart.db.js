'use strict'

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

const paramsForAdd = (table, id, itemId, item, now) => {
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

const now = () => {
    return new Date().getTime()
}

const tableName = () => {
    return process.env.CART_TABLE_NAME
}

module.exports.create = id => {
    const db = new AWS.DynamoDB.DocumentClient()
    return new Promise((resolve, reject) => {
        db.put(paramsForCreate(tableName(), id, now),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
    })
}

module.exports.delete = id => {
    const db = new AWS.DynamoDB.DocumentClient()
    return new Promise((resolve, reject) => {
        db.delete(paramsForDelete(tableName(), id),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
    })
}

module.exports.add = (id, itemId, item) => {
    const db = new AWS.DynamoDB.DocumentClient()
    return new Promise((resolve, reject) => {
        db.update(paramsForAdd(tableName(), id, itemId, item, now),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
    })
}

module.exports.remove = (id, itemId) => {
    const db = new AWS.DynamoDB.DocumentClient()
    return new Promise((resolve, reject) => {
        db.update(paramsForRemove(tableName(), id, itemId, now),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data)
                }
            })
    })
}

module.exports.get = id => {
    const getResult = data => Object.keys(data).length === 0
        ? { }
        : data.Item
    const db = new AWS.DynamoDB.DocumentClient()
    return new Promise((resolve, reject) => {
        db.get(paramsForGet(tableName(), id),
            (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(getResult(data))
                }
            })
    })
}

