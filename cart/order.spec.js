'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const order = require('./order')
const guid = require('../lib/guid')
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

const stubPut = (error, data) => {
    stubDynamo('put')(error, data)
}

const stubGet = (error, data) => {
    stubDynamo('get')(error, data)
}

const validBody = {
    cart_id: "1",
    email: "mario@rossi.lcl",
    rows: {
        '22': {
        }
    }
}

describe('creating an order', () => {
    var sandbox
    beforeEach(function () {
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        sandbox.restore()
    })

    it('when dynamodb raises an error', (done) => {
        stubPut(new Error('what a bug'), { })
        order.create({
            body: JSON.stringify(validBody)
        }, null, (error, result) => {
            expect(500).to.be.equal(result.statusCode)
            done()
        })
    })

    it('when content is not valid', (done) => {
        order.create({
            body: "{"
        }, null, (error, result) => {
            expect(400).to.be.equal(result.statusCode)
            done()
        })
    })

    it('when validation fails', (done) => {
        order.create({
            body: "{}"
        }, null, (error, result) => {
            expect(422).to.be.equal(result.statusCode)
            done()
        })
    })

    it('happy path', (done) => {
        const orderId = '2'
        sandbox.stub(guid, 'generate', () => {
            return orderId
        })
        stubPut(null, { })
        order.create({
            headers: {
                'X-Forwarded-Proto': 'http',
                'Host': 'fak.eurl'
            },
            requestContext: {
                stage: 'dev'
            },
            body: JSON.stringify(validBody)
        }, null, (error, result) => {
            expect(201).to.be.equal(result.statusCode)
            expect('http://fak.eurl/dev/orders/2').to.be.equal(result.headers.Location)
            done()
        })
    })
})

