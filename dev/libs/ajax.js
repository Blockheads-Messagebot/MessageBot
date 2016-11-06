(function() {
    var ajax = (function() { //jshint ignore:line
        function urlStringify(obj) {
            return Object.keys(obj)
                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
                .join('&');
        }

        /**
         * Helper function to make XHR requests.
         *
         * @param string protocol
         * @param string url
         * @param object paramObj -- WARNING. Only accepts shallow objects.
         * @return Promise
         */
        function xhr(protocol, url = '/', paramObj = {}) {
            var paramStr = urlStringify(paramObj);
            return new Promise(function(resolve, reject) {
                var req = new XMLHttpRequest();
                req.open(protocol, url);
                req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if (protocol == 'POST') {
                    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                }

                req.onload = function() {
                    if (req.status == 200) {
                        resolve(req.response);
                    } else {
                        reject(new Error(req.statusText));
                    }
                };
                // Handle network errors
                req.onerror = function() {
                    reject(Error("Network Error"));
                };
                if (paramStr) {
                    req.send(paramStr);
                } else {
                    req.send();
                }
            });
        }

        /**
         * Function to GET a page. Passes the response of the XHR in the resolve promise.
         *
         * @param string url
         * @param string paramStr
         * @return Promise
         */
        function get(url = '/', paramObj = {}) {
            if (Object.keys(paramObj).length) {
                var addition = urlStringify(paramObj);
                if (!url.includes('?')) {
                    url += `?${addition}`;
                } else {
                    url += `&${addition}`;
                }
            }
            return xhr('GET', url, {});
        }

        /**
         * Returns a JSON object in the promise resolve method.
          *
         * @param string url
         * @param object paramObj
         * @return Promise
         */
        function getJSON(url = '/', paramObj = {}) {
            return get(url, paramObj).then(JSON.parse);
        }

        /**
         * Function to make a post request
         *
         * @param string url
         * @param object paramObj
         * @return Promise
         */
        function post(url = '/', paramObj = {}) {
            return xhr('POST', url, paramObj);
        }

        /**
         * Function to fetch JSON from a page through post.
         *
         * @param string url
         * @param string paramObj
         * @return Promise
         */
        function postJSON(url = '/', paramObj = {}) {
            return post(url, paramObj).then(JSON.parse);
        }

        return {xhr, get, getJSON, post, postJSON};
    }());

    window.ajax = ajax;
}());
