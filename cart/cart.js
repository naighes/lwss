'use strict';

module.exports.create = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'it does nothing by now; it\'s just up \'n running.',
            input: event,
        }),
    };

    callback(null, response);
};



