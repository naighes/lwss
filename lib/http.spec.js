'use strict'

var expect = require('chai').expect
var http = require('./http')

describe('replying', () => {
    it('ok', (done) => {
        http.reply(200)
            .push((error, response) => {
                expect(response.statusCode).to.be.equal(200)
                done()
            })
    })

    it('adding location', (done) => {
        http.reply(200)
            .location('http://fak.eurl')
            .push((error, response) => {
                expect(response.statusCode).to.be.equal(200)
                expect(response.headers.Location).to.be.equal('http://fak.eurl')
                done()
            })
    })

    it('json content', (done) => {
        http.reply(200)
            .jsonContent({ foo: 'bar' })
            .push((error, response) => {
                expect(response.statusCode).to.be.equal(200)
                expect(response.body).to.be.equal('{"foo":"bar"}')
                expect(response.headers['Content-Type']).to.be.equal('application/json; charset=utf-8')
                done()
            })
    })

    it('ETag', (done) => {
        http.reply(200)
            .jsonContent({ foo: 'bar' })
            .etag(new Date('1995-12-17T03:24:00').toString())
            .push((error, response) => {
                expect(response.statusCode).to.be.equal(200)
                expect(response.headers['ETag']).to.be.equal('W/"U3VuIERlYyAxNyAxOTk1IDA0OjI0OjAwIEdNVCswMTAwIChDRVQp"')
                done()
            })
    })
})

describe('inspecting', () => {
    it('successful If-None-Match', done => {
        const ok = () => 'OK'
        const ko = () => 'KO'
        const result = http.inspect()
            .handleConditionalRequest({'If-None-Match': '"a"'}, '"a"')(ok, ko)()
        expect(result).to.be.equal('OK')
        done()
    })

    it('unsuccessful If-None-Match', done => {
        const ok = () => 'OK'
        const ko = () => 'KO'
        const result = http.inspect()
            .handleConditionalRequest({'If-None-Match': '"a"'}, '"b"')(ok, ko)()
        expect(result).to.be.equal('KO')
        done()
    })

    it('missing If-None-Match', done => {
        const ok = () => 'OK'
        const ko = () => 'KO'
        const result = http.inspect()
            .handleConditionalRequest({ }, '"a"')(ok, ko)()
        expect(result).to.be.equal('KO')
        done()
    })
})

