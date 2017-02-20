'use strict';

var expect = require('chai').expect
var sinon = require('sinon')
var cart = require('./cart')
var guid = require('../lib/guid')
var AWS = require('aws-sdk-mock');

const stubPut = (error, data) => {
    AWS.mock('DynamoDB.DocumentClient',
        'put',
        (params, callback) => {
            callback(error, data)
            AWS.restore('DynamoDB.DocumentClient');
        })
}

describe('creating a cart', () => {
    it('by invalid content', (done) => {
        cart.create({
            body: "{"
        }, null, (error, result) => {
            expect(400).to.be.equal(result.statusCode)
            done()
        })
    })

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

