'use strict';

module.exports.reply = (statusCode) => {
    function Reply(statusCode) {
        var $this = this;
        var response = {
            statusCode: statusCode,
            headers: { }
        }

        this.enableCors = () => {
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'X-Amz-Security-Token,Content-Type,X-Amz-Date,Authorization,X-Api-Key,Accept,User-Agent'
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

        this.getResponse = () => {
            return response
        }
    }

    return new Reply(statusCode)
}

