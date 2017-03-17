'use strict'

module.exports.inspect = () => {
    function Inspect() {
        var $this = this

        this.ifNoneMatch = (headers, etag) => (ok, ko) => headers.hasOwnProperty('If-None-Match') &&
            headers['If-None-Match']
            .split(',')
            .map(value => value.trim())
            .some(value => value === etag) ? ok : ko
    }

    return new Inspect()
}

module.exports.reply = (statusCode) => {
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
            response.headers['ETag'] = `W/"${new Buffer(value).toString('base64')}"`
            return $this
        }

        this.push = (callback) => {
            callback(null, response)
        }
    }

    return new Reply(statusCode)
}

