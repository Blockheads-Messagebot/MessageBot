// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
document.head.innerHTML = '';

require('app/ui/polyfills/console');
require('app/libraries/migration');

const bhfansapi = require('app/libraries/bhfansapi');

require('app/console');
require('app/messages');
require('app/settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});
