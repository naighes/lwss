'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const consumer = require('./consumer')
const sendgrid = require('../lib/sendgrid')

describe('consuming order created', () => {
    it('one SNS message', (done) => {
        const message = JSON.stringify({
            cart: {
                email: 'mar@iorossi.lcl',
                rows: {
                    '1': {
                        description: 'red wine',
                        price: 12.3
                    },
                    '2': {
                        description: 'blond beer',
                        price: 5.2
                    }
                }
            }
        })
        sinon.stub(sendgrid, 'emptyRequest', (descriptor) => {
            return { }
        })
        sinon.stub(sendgrid, 'API', (request, callback) => {
            callback(null, { statusCode: 200 })
        })
        consumer.newOrder({
            Records: [{
                Sns: { Message: message }
            }]
        }, null, (error, result) => {
            expect('ok').to.be.equal(result)
            done()
        })
    })
})

