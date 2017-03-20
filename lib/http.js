'use strict'

module.exports.computeEtag = value => {
    const r = new Buffer(value)
        .toString('base64')
    return `W/"${r}"`
}

module.exports.inspect = () => {
    function Inspect() {
        var $this = this

        const etagMatch = (value, etag) => value.split(',')
            .map(value => value.trim())
            .some(value => value === etag)

        const dateMatch = (value, lastUpdate) => lastUpdate > new Date(value)

        const rules = {
            'If-None-Match': (value, etag, lastUpdate) => (a, b) => etagMatch(value, etag) ? a : b,
            'If-Match': (value, etag, lastUpdate) => (a, b) => etagMatch(value, etag) ? b : a,
            'If-Unmodified-Since': (value, etag, lastUpdate) => (a, b) => dateMatch(value, lastUpdate) ? b : a
        }

        const defaultRule = (a, b) => b

        this.handleConditionalRequest = (headers, etag, lastUpdate) =>
            Object.keys(headers)
                .map(v => {
                    return { key: v, value: headers[v] }
                })
                .filter(v => Object.keys(rules).indexOf(v.key) !== -1)
                .map(v => rules[v.key](v.value, etag, lastUpdate))
                .shift() || defaultRule
    }

    return new Inspect()
}

module.exports.reply = statusCode => {
    function Reply(statusCode) {
        var $this = this
        var response = {
            statusCode: statusCode,
            headers: { }
        }

        this.enableCors = () => {
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'X-Amz-Security-Token,Content-Type,X-Amz-Date,Authorization,X-Api-Key,Accept,User-Agent,Location'
            response.headers['Access-Control-Expose-Headers'] = 'X-Amz-Security-Token,Content-Type,X-Amz-Date,Authorization,X-Api-Key,Accept,User-Agent,Location'
            response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,HEAD,OPTIONS'
            return $this
        }

        this.location = (value) => {
            response.headers.Location = value
            return $this
        }

        this.lastModified = (value) => {
            response.headers['Last-Modified'] = value.toISOString()
            return $this
        }

        this.jsonContent = (value) => {
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
            response.body = JSON.stringify(value)
            return $this
        }

        this.notFoundContent = () => {
            response.headers['Content-Type'] = 'text/plain; charset=us-ascii'
            response.body = rawNotFound
            return $this
        }

        this.etag = value => {
            response.headers['ETag'] = module.exports.computeEtag(value)
            return $this
        }

        this.push = (callback) => {
            callback(null, response)
        }
    }

    return new Reply(statusCode)
}

