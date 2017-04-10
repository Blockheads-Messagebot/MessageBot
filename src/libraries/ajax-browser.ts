// See ajax.ts for documentation.

export class Ajax {
    static get(url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
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

    static getJSON(url: string = '/', params: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
        return Ajax.get(url, params).then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
    }

    static post(url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
        return xhr('POST', url, params);
    }

    static postJSON(url: string = '/', params: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
        return Ajax.post(url, params).then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
    }
}

/**
 * Helper function to make XHR requests.
 */
function xhr(protocol: string, url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
    var paramStr = urlStringify(params);
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
            reject(new Error("Network Error"));
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
