var getHook = (function() { //jshint ignore:line
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function call(key, initial, ...args) {
        if (!listeners[key]) {
            return initial;
        }

        return listeners[key].reduce(function(previous, current) {
            try {
                return current(previous, ...args);
            } catch(e) {
                console.log(e);
                return previous;
            }
        }, initial);
    }

    return function() {
        return {listen, call};
    };
}());
