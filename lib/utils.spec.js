'use strict'

var expect = require('chai').expect
var utils = require('./utils')

describe('checking', function () {
    it('empty', done => {
        expect(utils.empty({ })).to.be.equal(true)
        done()
    })

    it('non empty', done => {
        expect(utils.notEmpty({ Arguments: { }})).to.be.equal(true)
        done()
    })
})

