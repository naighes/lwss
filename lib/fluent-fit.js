var Perform = (fun) => {
    var fun = fun

    return {
        then: (onSuccess, onError) => {
            try { onSuccess(fun()) }
            catch (e) { onError(e) }
        }
    }
}

module.exports.perform = (fun) => {
    return Perform(fun)
}

