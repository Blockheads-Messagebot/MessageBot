//TODO: Use fetch

// no-any must be disabled for getJSON, postJSON
// tslint:disable:no-any

/**
 * Function to GET a page. Passes the response of the XHR in the resolve promise.
 *
 * @example
 * //sends a GET request to /some/url.php?a=test
 * get('/some/url.php', {a: 'test'}).then(console.log)
 */
export function get(url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
    if (Object.keys(params).length) {
        var addition = urlStringify(params);
        if (url.includes('?')) {
            url += `&${addition}`;
        } else {
            url += `?${addition}`;
        }
    }

    return xhr('GET', url, {});
}


/**
 * Returns a JSON object from the response.
 * @example
 * getJSON('/', {id: '123'}).then(console.log);
 */
export function getJSON(url: string = '/', paramObj: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
    return get(url, paramObj).then(JSON.parse);
}


/**
 * Function to make a post request
 * @example
 * post('/', {id: '123'}).then(console.log);
 */
export function post(url: string = '/', paramObj: {[key: string]: string|number} = {}): Promise<string> {
    return xhr('POST', url, paramObj);
}


/**
 * Function to fetch JSON from a page through post.
 * @example
 * postJSON('/', {id: 'test'}).then(console.log);
 */
export function postJSON(url: string = '/', paramObj: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
    return post(url, paramObj).then(JSON.parse);
}


/**
 * Helper function to make XHR requests.
 */
function xhr(protocol: string, url: string = '/', paramObj: {[key: string]: string|number} = {}): Promise<string> {
    var paramStr = urlStringify(paramObj);
    return new Promise<string>(function(resolve, reject) {
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
 * Internal function used to stringify url parameters
 */
function urlStringify(obj: {[key: string]: string|number}): string {
    return Object.keys(obj)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k].toString())}`)
        .join('&');
}
