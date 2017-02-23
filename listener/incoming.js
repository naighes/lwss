'use strict';

const AWS = require('aws-sdk');
const attr = require('dynamodb-data-types').AttributeValue
const async = require('async')

const handler = (record, callback) => {
    const sns = new AWS.SNS()
    sns.publish(getParams(record, topicArn()),
        (error, data) => {
            if (error) {
                callback(error)
            } else {
                callback()
            }
        })
}

const topicArn = () => {
    return process.env.ORDER_TOPIC_ARN
}

const getParams = (record, topicArn) => {
    const image = attr.unwrap(record.dynamodb.NewImage)

    return {
        Message: JSON.stringify({
            cart: image
        }),
        MessageAttributes: {
            message_id: {
                DataType: "String",
                StringValue: record.eventID.toString()
            },
            content_type: {
                DataType: "String",
                StringValue: "application/json; charset=utf-8"
            }
        },
        Subject: "order_created",
        TopicArn: topicArn
    }
}

module.exports.order = (event, context, callback) => {
    const handleResult = (error) => {
        if (error) {
            callback(error)
        } else {
            callback(null, 'ok')
        }
    }

    async.eachSeries(event.Records || [],
        handler,
        handleResult)
}

