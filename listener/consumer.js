'use strict'

const sendgrid = require('../lib/sendgrid')
const async = require('async')

module.exports.newOrder = (event, context, callback) => {
    async.eachSeries(event.Records, withRecord, (error) => {
        if (error) {
            callback(error);
        } else {
            callback(null, 'ok');
        }
    })
}

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

const send = (message, callback) => {
    sendgrid.API(sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [{
                to: [{ email: message.cart.email }],
                subject: 'here\'s your order'
            }],
            from: { email: 'noreply@lif-ewithou-tservers.com' },
            content: [{
                type: 'text/html',
                value: emailBody(message.cart) }],
        }
    }), callback)
}

const emailBody = (cart) => {
    return '<html><header></header><body><h1>you order</h1><table>' +
        Object.reduce(cart.rows, '', (previous, value) => {
            return `${previous}<tr><td>${value.description}</td><td>${value.price}</td></tr>`
        }) + '</table></body></html>'
}

Object.reduce = (source, acc, fun) => {
    return Object.keys(source).reduce((previous, key) => {
        const value = source[key]
        return fun(previous, value)
    }, acc);
}

