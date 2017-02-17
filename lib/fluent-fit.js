var Perform = (fun, error) => {
    const then = (onSuccess, onError) => {
        try {
            const result = {
                result: fun()
            }
            const continuation = onSuccess(result)
            return Perform(() => {
                return continuation
            })
        }
        catch (e) {
            handleOnError(e, onError)
        }
    }

    const handleOnError = (e, onError) => {
        onError(e)
        return Perform(() => {
            return {
                error: e
            }
        }, e)
    }

    return { then: then }
}

module.exports.perform = (fun) => {
    return Perform(fun)
}

