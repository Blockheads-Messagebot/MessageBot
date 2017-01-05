//Imported vars / functions
/*globals
    INCLUDE_FILE
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

require('./polyfills/console');
require('./libs/migration');

var ui = require('./ui');
var bhfansapi = require('./libs/bhfansapi');
var hook = require('./libs/hook');

hook.on('error', bhfansapi.reportError);

INCLUDE_FILE('/dev/MessageBot.js');
INCLUDE_FILE('/dev/MessageBotExtension.js');


window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});
