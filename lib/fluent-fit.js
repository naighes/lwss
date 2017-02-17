var Perform = (fun) => {
    var then = (onSuccess, onError) => {
        try {
            var result = onSuccess(fun())
            return Perform(() => result)
        }
        catch (e) {
            onError(e)
        }
    }

    return { then: then }
}

module.exports.perform = (fun) => {
    return Perform(fun)
}

