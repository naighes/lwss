'use strict';

var expect = require('chai').expect
var http = require('./http')

describe('replying', function () {
    it('ok', (done) => {
        var response = http.reply(200).getResponse()
        expect(response.statusCode).to.be.equal(200)
        done()
    })

    it('adding location', (done) => {
        var response = http.reply(200)
            .location('http://fak.eurl')
            .getResponse()
        expect(response.statusCode).to.be.equal(200)
        expect(response.headers.Location).to.be.equal('http://fak.eurl')
        done()
    })

    it('json content', (done) => {
        var response = http.reply(200)
            .jsonContent({ foo: 'bar' })
            .getResponse()
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.be.equal('{"foo":"bar"}')
        expect(response.headers['Content-Type']).to.be.equal('application/json; charset=utf-8')
        done()
    })
})

