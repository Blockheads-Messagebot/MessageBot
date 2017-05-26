/**
 * System generic class for making http requests. Extensions can use through ex.ajax.
 */
export declare class Ajax {
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
    static get(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<string>;
    /**
     * Returns a JSON object from the response.
     *
     * @param url the url to fetch.
     * @param params any parameters to add to the URL in the format of key=value
     * @return the result parsed as JSON
     * @example
     * getJSON('/', {id: '123'}).then(console.log);
     */
    static getJSON(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<{
        [key: string]: any;
    }>;
    /**
     * Function to make a post request
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the raw result.
     * @example
     * post('/', {id: '123'}).then(console.log);
     */
    static post(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<string>;
    /**
     * Function to fetch JSON from a page through post.
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the result parsed as JSON.
     * @example
     * postJSON('/', {id: 'test'}).then(console.log);
     */
    static postJSON(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<{
        [key: string]: any;
    }>;
}
