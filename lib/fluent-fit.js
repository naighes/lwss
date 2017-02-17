var Perform = (fun) => {
    var then = (onSuccess, onError) => {
        try {
            var result = {
                result: fun()
            }
            var continuation = onSuccess(result)
            return Perform(() => {
                return continuation
            })
        }
        catch (e) {
            onError(e)
            return Perform(() => {
                return {
                    error: e
                }
            })
        }
    }

    return { then: then }
}

module.exports.perform = (fun) => {
    return Perform(fun)
}

