//Imported vars / functions
/*globals
    getAjax,
    getHook,
    getStorage,
    BHFansAPI,
    BlockheadsAPI,
    MessageBot,
    MessageBotUI
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

//IE doesn't like console.log unless dev tools are open.
if (!window.console) {
    window.console = {};
    window.log = window.log || [];
    console.log = function(...args) {
        window.log.push(args);
    };
}
['info', 'error', 'warn', 'assert'].forEach(method => {
    if (!console[method]) {
        console[method] = console.log;
    }
});

// jshint ignore:start
{{inject libs/migration.js}} //Update localStorage entries with old data
{{inject libs/ajax.js}} //Browser
{{inject libs/hook.js}} //Node + Browser
{{inject libs/storage.js}} //Browser -- Depends: worldId
window.storage = CreateStorage(window.worldId);

{{inject libs/BHFansAPI.js}} //Depends: ajax, storage
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage, window);

{{inject libs/BlockheadsAPI.js}} //Browser -- Depends: ajax, worldId, hook
window.api = BlockheadsAPI(window.ajax, window.worldId, window.hook, window.bhfansapi);

{{inject libs/MessageBotUI.js}} //Depends: hook, BHFansAPI
window.botui = MessageBotUI(window.hook, window.bhfansapi);

{{inject libs/popups.js}} //Depends: botui, bhfansapi

{{inject MessageBot.js}}
{{inject MessageBotExtension.js}}
// jshint ignore:end

var bot = MessageBot( //jshint unused:false
            window.ajax,
            window.hook,
            window.storage,
            window.bhfansapi,
            window.api,
            window.botui
        );

window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});
