/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

import * as ajax from 'libraries/ajax';

const API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/api/extension/store',
    NAME: '//blockheadsfans.com/messagebot/api/extension/info',
    ERROR: '//blockheadsfans.com/messagebot/api/error',
};

interface ExtensionInfo {
    id: string;
    title: string;
    snippet: string;
};

interface StoreResponse {
    status: string;
    extensions: [ExtensionInfo];
};

interface ErrorResponse {
    status: string;
    message?: string;
};

var cache: {info: Map<string, ExtensionInfo>, getStore?: Promise<StoreResponse>} = {
    info: new Map<string, ExtensionInfo>()
};

/**
 * Used to get public extensions
 *
 * @example
 * getStore().then(store => console.log(store));
 */
export function getStore(refresh: boolean = false): Promise<StoreResponse> {
    if (refresh || !cache.getStore) {
        cache.getStore = ajax.getJSON(API_URLS.STORE)
            .then((store: StoreResponse) => {
                //Build the initial names map
                if (store.status != 'ok') {
                    return store;
                }

                for (let ex of store.extensions) {
                    cache.info.set(ex.id, ex);
                }
                return store;
            });
    }

    return cache.getStore;
}


/**
 * Gets the name of the provided extension ID.
 * If the extension was not found, resolves with the original passed ID.
 *
 * @example
 * getExtensionInfo('test').then(info => console.log(info));
 */
export function getExtensionInfo(id: string): Promise<ExtensionInfo> {
    if (cache.info.has(id)) {
        return Promise.resolve(cache.info.get(id));
    }

    return ajax.getJSON(API_URLS.NAME, {id}).then(({id, title, snippet}: ExtensionInfo) => {
        return cache.info
            .set(id, {id, title, snippet})
            .get(id);
    }, (err: Error) => {
        reportError(err);
        return {name: id, id: id, snippet: 'No description.'};
    });
}


/**
 * Reports an error so that it can be reviewed and fixed by extension or bot developers.
 *
 * @example
 * reportError(Error("Report me"));
 */
export function reportError(err: ErrorEvent): void {
    ajax.postJSON(API_URLS.ERROR, {
            error_text: err.message,
            error_file: err.filename,
            error_row: err.lineno,
            error_column: err.colno,
            error_stack: (<{stack?: string}>err).stack || '', // Might not be there in some browsers
        })
        .then((resp: ErrorResponse) => {
            if (resp.status == 'ok') {
                hook.fire('error_report', 'Something went wrong, it has been reported.');
            } else {
                hook.fire('error_report', `Error reporting exception: ${resp.message}`);
            }
        })
        .catch(console.error);
}