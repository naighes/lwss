'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const incoming = require('./incoming')
const attr = require('dynamodb-data-types')
const AWS = require('aws-sdk-mock')

const stubPublish = (error, data) => {
    AWS.mock('SNS',
        'publish',
        (params, callback) => {
            callback(error, data)
            AWS.restore('SNS')
        })
}

describe('stream is triggered', () => {
    it('when no records', (done) => {
        incoming.order({
            Records: []
        }, null, (error, result) => {
            expect('ok').to.be.equal(result)
            done()
        })
    })

    it('when one record with no errors', (done) => {
        sinon.stub(attr.AttributeValue, 'unwrap', (image) => {
            return {
                id: '1'
            }
        })
        stubPublish(null, { })
        incoming.order({
            Records: [{
                dynamodb: {
                    NewImage: {
                    }
                },
                eventID: '123'
            }]
        }, null, (error, result) => {
            expect('ok').to.be.equal(result)
            done()
        })
    })
})

