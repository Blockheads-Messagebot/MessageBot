(function() {
    function api(hook, ajax, storage) {
        var cache = {
            getStore: getStore(),
        };

        var extensions = [];

        function getStore() {
            return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
        }

        function listExtensions() {
            api.getExtensionNames(extensions).then((resp) => {
                var target = document.querySelector('#mb_ext_list');
                if (resp.status == 'ok') {
                    Array.from(document.querySelectorAll('#exts button'))
                        .forEach(btn => btn.textContent = 'Install');

                    resp.extensions.forEach(ex => {
                        var button = document.querySelector(`#exts [data-id="${ex.id}"] button`);
                        if (button) {
                            button.textContent = 'Remove';
                        }
                    });

                    if (!resp.extensions.length) {
                        target.innerHTML = '<p>No extensions installed</p>';
                        return;
                    }
                    target.innerHTML = resp.extensions
                        .reduce((html, ext) => {
                            return `${html}<li>${ext.name.replace(/</g, '&lt;')} (${ext.id}) <a onclick="bhfansapi.removeExtension(\'${ext.id}\');" class="button">Remove</a></li>`;
                        }, '<ul style="margin-left:1.5em;">') + '</ul>';

                } else {
                    target.innerHTML = `Error fetching extension names: ${resp.message}`;
                    throw new Error(resp.message);
                }
            })
            .catch(api.reportError);
        }


        var api = {};

        // ids is an array of extension ids
        api.getExtensionNames = (ids) => ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', {extensions: JSON.stringify(ids)});

        api.getStore = (refresh = false) => {
            if (refresh) {
                cache.getStore = getStore();
            }
            return cache.getStore;
        };

        // Loads the specified extension from BHFans
        api.startExtension = (id) => {
            var el = document.createElement('script');
            el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
            el.crossOrigin = 'anonymous';
            document.head.appendChild(el);
        };
        //Delay starting extensions - avoids some odd bugs
        setTimeout(function() {
            storage.getObject('mb_extensions', [], false).forEach(api.startExtension);
        }, 1000);


        api.removeExtension = (id) => {
            //Try to call the uninstall function
            try {
                window[id].uninstall();
            } catch(e) {
                // Normal if an uninstall function was not defined.
            }
            window[id] = undefined;

            if (extensions.includes(id)) {
                extensions.splice(extensions.indexOf(id), 1);
                storage.set('mb_extensions', extensions, false);

                var button = document.querySelector(`#mb_extensions div[data-id=${id}] button`);
                if (button !== null) {
                    button.textContent = 'Removed';
                    button.disabled = true;
                    setTimeout(() => {
                        button.textContent = 'Install';
                        button.disabled = false;
                    }, 3000);
                }
                listExtensions();
            }
        };

        api.extensionInstalled = (id) => {
            return extensions.includes(id);
        };

        //FIXME: Avoid relying on window.bot.ui
        api.reportError = (err) => {
            ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
                error_stack: err.stack || '',
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

        api.autoloadExtension = (id, shouldAutoload) => {
            if (!api.extensionInstalled(id) && shouldAutoload) {
                extensions.push(id);
                listExtensions();
            } else if (!shouldAutoload) {
                if (api.extensionInstalled(id)) {
                    extensions.splice(extensions.indexOf(id), 1);
                }
            }

            storage.set('mb_extensions', extensions, false);
        };

        //Listen for errors
        hook.listen('error', api.reportError);

        //Timeout to allow for building the page before a response is recieved
        setTimeout(listExtensions, 500);
        return api;
    }

    window.CreateBHFansAPI = api;
}());
