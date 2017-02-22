'use strict';

const expect = require('chai').expect
const sinon = require('sinon')
const order = require('./order')
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

const stubGet = (error, data) => {
    stubDynamo('get')(error, data)
}

describe('creating an order', () => {
    it('when dynamodb raises an error', (done) => {
        stubPut(new Error('what a bug'), { })
        order.create({
            body: "{}"
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

    it('happy path', (done) => {
        const orderId = '2'
        sinon.stub(guid, 'generate', () => {
            return orderId
        });
        stubPut(null, { })
        order.create({
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
            expect('http://fak.eurl/dev/orders/2').to.be.equal(result.headers.Location)
            done()
        })
    })
})

