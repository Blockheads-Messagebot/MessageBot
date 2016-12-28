//Imported vars / functions
/*globals
    INCLUDE_FILE,
    MessageBot
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

//jshint -W117
INCLUDE_FILE('libs/migration.js'); //Update localStorage entries with old data
INCLUDE_FILE('libs/ajax.js'); //Browser
INCLUDE_FILE('libs/hook.js'); //Node + Browser
INCLUDE_FILE('libs/storage.js'); //Browser -- Depends: worldId
window.storage = CreateStorage(window.worldId);

INCLUDE_FILE('libs/BHFansAPI.js'); //Depends: ajax, storage
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage, window);

INCLUDE_FILE('libs/BlockheadsAPI.js'); //Browser -- Depends: ajax, worldId, hook
window.api = BlockheadsAPI(window.ajax, window.worldId, window.hook, window.bhfansapi);

INCLUDE_FILE('libs/MessageBotUI.js'); //Depends: hook, BHFansAPI
window.botui = MessageBotUI(window.hook, window.bhfansapi);

INCLUDE_FILE('libs/popups.js'); //Depends: botui, bhfansapi

INCLUDE_FILE('MessageBot.js');
INCLUDE_FILE('MessageBotExtension.js');
//jshint +W117

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
