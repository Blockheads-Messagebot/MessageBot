/*globals
    INCLUDE_FILE
*/

// Build the page

document.head.innerHTML = INCLUDE_FILE('/dist/tmphead.html');

var s = document.createElement('style');
s.textContent = INCLUDE_FILE('/dist/tmpbot.css');
document.head.appendChild(s);

document.body.innerHTML = INCLUDE_FILE("/dist/tmpbody.html");

require('../../polyfills/details');

require('./extensions');
require('./settings');
