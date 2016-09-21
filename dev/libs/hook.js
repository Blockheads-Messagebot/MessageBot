(function() {
    var hook = (function() {
        var listeners = {};

        function listen(key, callback) {
            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                listeners[key] = [];
            }
            listeners[key].push(callback);
        }

        function remove(key, callback) {
            key = key.toLocaleLowerCase();
            if (listeners[key]) {
                if (listeners[key].includes(callback)) {
                    listeners[key].splice(listeners[key].indexOf(callback), 1);
                }
            }
        }

        function check(key, ...args) {
            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                return;
            }

            listeners[key].forEach(function(listener) {
                try {
                    listener(...args);
                } catch (e) {
                    console.error(e);
                }
            });
        }

        function update(key, initial, ...args) {
            key = key.toLocaleLowerCase();
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

        return {
            listen,
            remove,
            check,
            update,
        };
    }());

    //Node & Browser
    //jshint -W117
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = hook;
    } else {
        window.hook = hook;
    }
}());
