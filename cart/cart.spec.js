'use strict';

const expect = require('chai').expect
const sinon = require('sinon')
const cart = require('./cart')
const guid = require('../lib/guid')
const AWS = require('aws-sdk-mock');

const stubDynamo = (method) => {
    return (error, data) => {
        AWS.mock('DynamoDB.DocumentClient',
            method,
            (params, callback) => {
                callback(error, data)
                AWS.restore('DynamoDB.DocumentClient');
            })
    }
}

const stubPut = (error, data) => {
    stubDynamo('put')(error, data)
}

const stubUpdate = (error, data) => {
    stubDynamo('update')(error, data)
}

const stubGet = (error, data) => {
    stubDynamo('get')(error, data)
}

describe('creating a cart', () => {
    it('when dynamodb raises an error', (done) => {
        stubPut(new Error('what a bug'), { })
        cart.create({
            body: "{}"
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path', (done) => {
        const cartId = '2'
        sinon.stub(guid, 'generate', () => {
            return cartId
        });
        stubPut(null, { })
        cart.create({
            headers: {
                'X-Forwarded-Proto': 'http',
                'Host': 'fak.eurl'
            },
            requestContext: {
                stage: 'dev'
            },
            body: "{}"
        }, null, (error, result) => {
            expect(201).to.be.equal(result.statusCode)
            expect('http://fak.eurl/dev/carts/2').to.be.equal(result.headers.Location)
            done()
        })
    })
})

describe('adding an item', () => {
    it('when dynamodb raises an error', (done) => {
        stubUpdate(new Error('what a bug'), { })
        cart.add({
            pathParameters: {
                id: '123-456',
                item_id: '789'
            },
            body: "{ }"
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path', (done) => {
        stubUpdate(null, { })
        cart.add({
            pathParameters: {
                id: '123-456',
                item_id: '789'
            },
            body: "{ }"
        }, null, (error, result) => {
            expect(204).to.be.equal(result.statusCode)
            done()
        })
    })
})

describe('retrieving a cart', () => {
    it('when dynamodb raises an error', (done) => {
        stubGet(new Error('what a bug'), { })
        cart.get({
            pathParameters: {
                id: '123-456'
            }
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('when dynamodb returns empty', (done) => {
        stubGet(null, { })
        cart.get({
            pathParameters: {
                id: '123-456'
            }
        }, null, (error, result) => {
            expect(404).to.be.equal(result.statusCode)
            done()
        })
    })
})

