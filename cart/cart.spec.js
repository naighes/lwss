'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const cart = require('./cart')
const guid = require('../lib/guid')
const AWS = require('aws-sdk-mock')

const stubDynamo = method => {
    return (error, data) => {
        AWS.mock('DynamoDB.DocumentClient',
            method,
            (params, callback) => {
                callback(error, data)
                AWS.restore('DynamoDB.DocumentClient')
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

const stubDelete = (error, data) => {
    stubDynamo('delete')(error, data)
}

describe('creating a cart', () => {
    var sandbox
    beforeEach(function () {
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        sandbox.restore()
    })

    it('when dynamodb raises an error', done => {
        stubPut(new Error('what a bug'), { })
        cart.create({ body: "{ }" }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path', done => {
        const cartId = '2'
        sandbox.stub(guid, 'generate', () => cartId)
        stubPut(null, { })
        cart.create({
            headers: {
                'X-Forwarded-Proto': 'http',
                'Host': 'fak.eurl'
            },
            requestContext: { stage: 'dev' },
            body: "{ }"
        }, null, (error, result) => {
            expect(201).to.be.equal(result.statusCode)
            expect('http://fak.eurl/dev/carts/2').to.be.equal(result.headers.Location)
            done()
        })
    })
})

describe('deleting a cart', () => {
    it('when dynamodb raises an error', done => {
        stubDelete(new Error('what a bug'), { })
        cart.delete({
            pathParameters: { id: '2' }
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and non existing', done => {
        stubDelete(null, { })
        cart.delete({
            pathParameters: { id: '2' }
        }, null, (error, result) => {
            expect(404).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and existing', done => {
        stubDelete(null, {
            Attributes: { id: '2' }
        })
        cart.delete({
            pathParameters: { id: '2' }
        }, null, (error, result) => {
            expect(204).to.be.equal(result.statusCode)
            done()
        })
    })
})

describe('adding an item', () => {
    it('when dynamodb raises an error', done => {
        stubUpdate(new Error('what a bug'), { })
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { 'If-Unmodified-Since': '1970-01-18T02:15:48.794Z' },
            body: "{ }"
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('when content is invalid', done => {
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { 'If-Unmodified-Since': '1970-01-18T02:15:48.794Z' },
            body: "{"
        }, null, (error, result) => {
            expect(400).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and non existing', done => {
        stubUpdate(null, {
            Attributes: { last_update: 1476949794 }
        })
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { 'If-Unmodified-Since': '1970-01-18T02:15:48.794Z' },
            body: "{ }"
        }, null, (error, result) => {
            expect(201).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and already existing', done => {
        stubUpdate(null, {
            Attributes: {
                last_update: 1476949794,
                rows: {
                    '789': { }
                }
            }
        })
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { 'If-Unmodified-Since': '1970-01-18T02:15:48.794Z' },
            body: "{ }"
        }, null, (error, result) => {
            expect(204).to.be.equal(result.statusCode)
            done()
        })
    })

    it('missing "If-Unmodified-Since"', done => {
        stubUpdate(null, { })
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { },
            body: "{ }"
        }, null, (error, result) => {
            expect(403).to.be.equal(result.statusCode)
            done()
        })
    })

    it('last_update is missing', done => {
        stubUpdate(null, {
            Attributes: { }
        })
        cart.add({
            pathParameters: { id: '123-456', item_id: '789' },
            headers: { 'If-Unmodified-Since': '1970-01-18T02:15:48.794Z' },
            body: "{ }"
        }, null, (error, result) => {
            expect(412).to.be.equal(result.statusCode)
            done()
        })
    })
})

describe('removing an item', () => {
    it('when dynamodb raises an error', done => {
        stubUpdate(new Error('what a bug'), { })
        cart.remove({
            pathParameters: { id: '123-456', item_id: '789' }
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and non existing', done => {
        stubUpdate(null, { })
        cart.remove({
            pathParameters: { id: '123-456', item_id: '789' }
        }, null, (error, result) => {
            expect(404).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path and existing', done => {
        stubUpdate(null, {
            Attributes: {
                rows: {
                    '789': { }
                }
            }
        })
        cart.remove({
            pathParameters: {
                id: '123-456',
                item_id: '789'
            }
        }, null, (error, result) => {
            expect(204).to.be.equal(result.statusCode)
            done()
        })
    })
})

describe('retrieving a cart', () => {
    it('when dynamodb raises an error', done => {
        stubGet(new Error('what a bug'), { })
        cart.get({
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('when dynamodb returns empty', done => {
        stubGet(null, { })
        cart.get({
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(404).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path', done => {
        stubGet(null, {
            Item: {
                last_update: 1476949794,
                rows: {
                    '23': { description: 'cool shoes', price: 34.2 }
                }
            }})
        cart.get({
            headers: { },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(200).to.be.equal(result.statusCode)
            expect('Sun, 18 Jan 1970 02:15:49 UTC').to.be.equal(result.headers['Last-Modified'])
            const row = JSON.parse(result.body).rows['23']
            expect(34.2).to.be.equal(row.price)
            expect('cool shoes').to.be.equal(row.description)
            done()
        })
    })
})

describe('conditional requests', () => {
    it('If-None-Match', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }
        })
        cart.get({
            headers: { 'If-None-Match': 'W/"U3VuIEphbiAxOCAxOTcwIDAzOjE1OjQ5IEdNVCswMTAwIChDRVQp"' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(304).to.be.equal(result.statusCode)
            done()
        })
    })

    it('If-None-Match', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }
        })
        cart.get({
            headers: { 'If-Match': 'W/"U3VuIEphbiAxOCAxOTcwIDAzOjE1OjQ5IEdNVCswMTAwIChDRVQp"' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(200).to.be.equal(result.statusCode)
            done()
        })
    })

    it('If-Unmodified-Since (modified)', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }
        })
        cart.get({
            headers: { 'If-Unmodified-Since': 'Sun, 18 Jan 1970 02:15:48 UTC' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(200).to.be.equal(result.statusCode)
            done()
        })
    })

    it('If-Unmodified-Since (not modified)', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }
        })
        cart.get({
            headers: { 'If-Unmodified-Since': 'Sun, 18 Jan 1970 02:15:50 UTC' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(304).to.be.equal(result.statusCode)
            done()
        })
    })

    it('If-Modified-Since (modified)', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }})
        cart.get({
            headers: { 'If-Modified-Since': 'Sun, 18 Jan 1970 02:15:48 UTC' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(304).to.be.equal(result.statusCode)
            done()
        })
    })

    it('If-Modified-Since (not modified)', done => {
        const last_update = 1476949794
        stubGet(null, {
            Item: { last_update: last_update }
        })
        cart.get({
            headers: { 'If-Modified-Since': 'Sun, 18 Jan 1970 02:15:50 UTC' },
            pathParameters: { id: '123-456' }
        }, null, (error, result) => {
            expect(200).to.be.equal(result.statusCode)
            done()
        })
    })
})

