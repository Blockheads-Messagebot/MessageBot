function BHFansAPI(ajax) { //jshint ignore:line
    var cache = {
        getStore: getStore(),
    };

    function getStore() {
        return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
    }

    var api = {};

    // ids is an array of extension ids
    api.getExtensionNames = (ids) => ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', {extensions: JSON.stringify(ids)});

    api.getStore = (refresh = false) => {
        if (refresh) {
            cache.getStore = getStore();
        }
        return cache.getStore();
    };

    // Loads the specified extension from BHFans
    api.startExtension = (id) => {
        var el = document.createElement('script');
        el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    };

    api.reportError = (err) => {
        console.error(err);
        ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                error_text: err.message,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
            })
            .then((resp) => {
                if (resp.status == 'ok') {
                    window.bot.ui.notify('Something went wrong, it has been reported.');
                } else {
                    throw new Error(resp.message);
                }
            })
            .catch((err) => {
                console.error(err);
                window.bot.ui.notify(`Error reporting exception: ${err}`);
            });
    };

    return api;
}
