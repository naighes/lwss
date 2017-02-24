'use strict'

const sendgrid = require('../lib/sendgrid')
const async = require('async')

const isValidResponse = (response) => {
    return response.statusCode >= 200 && response.statusCode < 300
}

const withRecord = (record, callback) => {
    send(JSON.parse(record.Sns.Message), (error, response) => {
        if (error) {
            callback(error)
        } else if (!isValidResponse(response)) {
            callback(new Error(`unexpected status code (${response.statusCode})`))
        } else {
            callback()
        }
    })
}

module.exports.newOrder = (event, context, callback) => {
    async.eachSeries(event.Records, withRecord, (error) => {
        if (error) {
            callback(error);
        } else {
            callback(null, 'ok');
        }
    })
}

const send = (message, callback) => {
    sendgrid.API(sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [{
                to: [{ email: message.cart.email }],
                subject: 'here\'s your order'
            }],
            from: { email: 'nic.baldi@gmail.com' },
            content: [{
                type: 'text/plain',
                value: 'Hello, Email!' }],
        }
    }), callback)
}

