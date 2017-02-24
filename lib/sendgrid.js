'use strict'

const sendgrid = require('sendgrid')

module.exports.emptyRequest = (descriptor) => {
    return sendgrid(process.env.SENDGRID_API_KEY).emptyRequest(descriptor)
}

module.exports.API = (request, callback) => {
    return sendgrid(process.env.SENDGRID_API_KEY).API(request, callback)
}

