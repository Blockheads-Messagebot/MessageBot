var getHook = (function() { //jshint ignore:line
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function remove(key, callback) {
        if (listeners[key]) {
            var position = listeners[key].indexOf(callback);
            if (~position) {
                listeners[key].splice(position, 1);
            }
        }
    }

    function check(key, initial, ...args) {
        if (!listeners[key]) {
            return initial;
        }

        return listeners[key].reduce(function(previous, current) {
            // Just a precaution...
            try {
                var result = current(previous, ...args);
                if (typeof result != 'undefined') {
                    return result;
                }
                return previous;
            } catch(e) {
                console.log(e);
                return previous;
            }
        }, initial);
    }

    return function() {
        return {listen, remove, check};
    };
}());
