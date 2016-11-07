(function() {
    function api(ajax, storage, global) {
        var cache = {
            getStore: getStore(),
        };

        var extensions = [];

        function getStore() {
            return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
        }

        var api = {};

        api.listExtensions = () => {
            return api.getExtensionNames(extensions).then((resp) => {
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
        };

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

        api.removeExtension = (id) => {
            //Try to call the uninstall function
            try {
                global[id].uninstall();
            } catch(e) {
                // Normal if an uninstall function was not defined.
            }
            global[id] = undefined;

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
                api.listExtensions();
            }
        };

        api.extensionInstalled = (id) => {
            return extensions.includes(id) || typeof global[id] != 'undefined';
        };

        //FIXME: Avoid relying on knowing bot.ui
        api.reportError = (err) => {
            return ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
                error_stack: err.stack || '',
            })
            .then((resp) => {
                if (resp.status == 'ok') {
                    global.bot.ui.notify('Something went wrong, it has been reported.');
                } else {
                    global.bot.ui.notify(`Error reporting exception: ${resp.message}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
        };

        api.autoloadExtension = (id, shouldAutoload) => {
            if (!extensions.includes(id) && shouldAutoload) {
                extensions.push(id);
                api.listExtensions();
            } else if (!shouldAutoload) {
                if (extensions.includes(id)) {
                    extensions.splice(extensions.indexOf(id), 1);
                    api.listExtensions();
                }
            }

            storage.set('mb_extensions', extensions, false);
        };

        return api;
    }

    window.CreateBHFansAPI = api;
}());
