// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
document.head.innerHTML = '';

require('app/ui/polyfills/console');
require('app/libraries/migration');

var bhfansapi = require('app/libraries/bhfansapi');
var hook = require('app/libraries/hook');

hook.on('error', bhfansapi.reportError);

require('app/console');


window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});
