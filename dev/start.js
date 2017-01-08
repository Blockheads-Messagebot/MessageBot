// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
document.querySelectorAll('[type="text/css"]')
    .forEach(el => el.remove());

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

require('app/ui/polyfills/console');
require('app/bot/migration');

// Expose the extension API
window.MessageBotExtension = require('app/MessageBotExtension');

const bhfansapi = require('app/libraries/bhfansapi');

require('app/console');
// By default no tab is selected, show the console.
document.querySelector('#leftNav span').click();
require('app/messages');
require('app/extensions');
require('app/settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});
