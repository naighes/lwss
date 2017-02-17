'use strict';

var expect = require('chai').expect
var fit = require('./fluent-fit')

describe('smoke test', function () {
    it('true is just true', (done) => {
        expect(true).to.be.equal(true)
        done()
    })
})

describe('performing', function () {
    it('errorless', (done) => {
        fit.perform(() => 2)
            .then((result) => {
                expect(result).to.be.equal(2)
                done()
            })
    })

    it('throwing error', (done) => {
        fit.perform(() => JSON.parse("Oh jeez..."))
            .then(null, (error) => {
                done()
            })
    })
})

