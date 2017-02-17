'use strict';
var fit = require('../lib/fluent-fit')

module.exports.create = (event, context, callback) => {
    fit.perform(() => JSON.parse(event.body))
        .then((result) => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'it does nothing by now; it\'s just up \'n running.',
                    input: event,
                })
            })
        }, (error) => {
            callback(null, {
                statusCode: 400,
                message: JSON.stringify({
                    message: 'it looks you sent invalid content for application/json media type'
                })
            })
        })
};

