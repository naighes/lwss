'use strict';

var expect = require('chai').expect
var cart = require('./cart')

describe('creating a cart', function () {
    it('by invalid content', (done) => {
        cart.create({
            body: "{"
        }, null, (error, result) => {
            expect(result.statusCode).to.be.equal(400)
            done()
        })
    })
})

