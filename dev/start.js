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

// jshint ignore:start
{{inject libs/ajax.js}} //Browser
{{inject libs/hook.js}} //Node + Browser
{{inject libs/BlockheadsAPI.js}} //Browser -- Depends: ajax, worldId, hook
window.api = BlockheadsAPI(window.ajax, window.worldId, window.hook);
{{inject libs/storage.js}} //Browser -- Depends: worldId
window.storage = CreateStorage(window.worldId);
{{inject libs/BHFansAPI.js}} //Depends: ajax, storage
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage);
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
    //Wrap everything here in a try catch so that errors with our error reporting don't generate more errors to be reported... infinite loop.
    try {
        if (err.message == 'Script error') {
            return;
        }

        window.bhfansapi.reportError(err);
    } catch (e) {
        console.error(e);
    }
});
