import * as http from 'http';
import {stringify} from 'querystring';
import {parse, resolve} from 'url';

/**
 * System generic class for making http requests. Extensions can use through ex.ajax.
 */
export class Ajax {

    /**
     * Function to GET a page. Passes the response of the XHR in the resolve promise.
     *
     * @param url the url to fetch.
     * @param params any parameters to add to the URL in the format of key=value
     * @return the raw page.
     * @example
     * get('/some/url.php', {a: 'test'}).then(console.log)
     * //sends a GET request to /some/url.php?a=test
     */
    static get(url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
        let to = parse(resolve('http://portal.theblockheads.net/', url));

        return new Promise(resolve => {
            let req = http.get({
                hostname: to.hostname,
                path: to.pathname + (to.search ? to.search : '?') + stringify(params),
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
                },
            }, res => {
                let data = '';
                res.on('data', (chunk: string) => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.end();
        });
    }

    /**
     * Returns a JSON object from the response.
     *
     * @param url the url to fetch.
     * @param params any parameters to add to the URL in the format of key=value
     * @return the result parsed as JSON
     * @example
     * getJSON('/', {id: '123'}).then(console.log);
     */
    static getJSON(url: string = '/', params: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
        return Ajax.get(url, params)
            .then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
    }

    /**
     * Function to make a post request
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the raw result.
     * @example
     * post('/', {id: '123'}).then(console.log);
     */
    static post(url: string = '/', params: {[key: string]: string|number} = {}): Promise<string> {
        let to = parse(resolve('http://portal.theblockheads.net/', url));

        return new Promise(resolve => {
            let req = http.request({
                hostname: to.hostname,
                path: to.path,
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-requested-with': 'XMLHttpRequest'
                }
            }, res => {
                let data = '';
                res.on('data', (chunk: string) => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.write(stringify(params));
            req.end();
        });
    }

    /**
     * Function to fetch JSON from a page through post.
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the result parsed as JSON.
     * @example
     * postJSON('/', {id: 'test'}).then(console.log);
     */
    static postJSON(url: string = '/', params: {[key: string]: string|number} = {}): Promise<{[key: string]: any}> {
        return Ajax.post(url, params)
            .then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
    }
}
