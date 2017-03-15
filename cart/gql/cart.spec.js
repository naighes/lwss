'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const cart = require('./cart')
const guid = require('../../lib/guid')
const AWS = require('aws-sdk-mock')

const stubDynamo = (method) => {
    return (error, data) => {
        AWS.mock('DynamoDB.DocumentClient',
            method,
            (params, callback) => {
                callback(error, data)
                AWS.restore('DynamoDB.DocumentClient')
            })
    }
}

const stubGet = (error, data) => {
    stubDynamo('get')(error, data)
}

describe('retrieving a cart', () => {
    it('happy path', (done) => {
        stubGet(null, {
            Item: {
                id: "111",
                last_update: 1476949794,
                rows: {
                    '23': {
                        description: 'cool shoes',
                        price: 34.2
                    }
                }
            }})
        const body = {
            query: 'query { cart(id: "1") { id, rows { price } } }'
        }
        const event = {
            body: JSON.stringify(body)
        }
        cart.handle(event,
            null,
            (error, result) => {
                expect('111').to.be.equal(result.data.cart.id)
                done()
            })
    })
})

