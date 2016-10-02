(function() {
    var storage = function(worldId) {
        function getString(key, fallback, local = true) {
            var result;
            if (local) {
                result = localStorage.getItem(`${key}${worldId}`);
            } else {
                result = localStorage.getItem(key);
            }

            return (result === null) ? fallback : result;
        }

        function getObject(key, fallback, local = true) {
            var result = getString(key, false, local);

            if (!result) {
                return fallback;
            }

            try {
                result = JSON.parse(result);
            } catch(e) {
                result = fallback;
            } finally {
                if (result === null) {
                    result = fallback;
                }
            }

            return result;
        }

        function set(key, data, local = true) {
            if (local) {
                key = `${key}${worldId}`;
            }

            if (typeof data == 'string') {
                localStorage.setItem(key, data);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        }

        function clearNamespace(namespace) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(namespace)) {
                    localStorage.removeItem(key);
                }
            });
        }

        return {getString, getObject, set, clearNamespace};
    };

    //Node doesn't have localStorage.
    window.CreateStorage = storage;
}());
