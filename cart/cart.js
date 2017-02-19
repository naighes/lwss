'use strict';

var fit = require('../lib/fluent-fit')
var http = require('../lib/http')

const invalidContent = () => {
    return http.reply(400)
        .jsonContent({
            message: 'it looks you sent invalid content for application/json media type'
        })
        .getResponse()
}

module.exports.create = (event, context, callback) => {
    fit.perform(() => JSON.parse(event.body))
        .then((result) => {
            callback(null, http.reply(200)
                .jsonContent({
                    message: 'it does nothing by now; it\'s just up \'n running.'
                }).getResponse())
        }, (error) => {
            callback(null, invalidContent())
        })
};

