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

    return api;
}
