//tslint:disable:no-any


// Overwrite the pollChat function to kill the default chat function
(<any>window).pollChat = function() {};

// First time the bot has been loaded?
var firstLoad = localStorage.length == 0;

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
Array.from(document.querySelectorAll('[type="text/css"]'))
    .forEach(el => el.remove());

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

import 'console-browserify';
import 'bot/migration';

import * as bhfansapi from 'libraries/bhfansapi';
import * as ui from 'ui';

function importTab(tab: HTMLDivElement, text: string, parent: string = '') {
    let temp = ui.addTab(text, parent);

    Array.from(temp.attributes).forEach((item: {name: string, value: any}) => {
        tab.setAttribute(item.name, item.value);
    });
}

// Build the page
// just import 'console' doesn't work as console is a browserify module.
import {tab as con} from './console';
importTab(con, 'Console');
// By default no tab is selected, show the console.
(<HTMLSpanElement>document.querySelector('.nav-slider-container span')).click();
ui.addTabGroup('Messages', 'messages');
import {tabs as msgTabs} from 'messages';
msgTabs.forEach(tab => importTab(tab.div, tab.name, 'messages'));
import 'settings';

// Error reporting
window.addEventListener('error', (err: ErrorEvent) => {
    if (!['Script error.', 'World not running', 'Network Error'].includes(err.message)) {
        bhfansapi.reportError(err);
    }
});

// Expose the extension API
import MessageBotExtension from 'MessageBotExtension';
(<any>window).MessageBotExtension = MessageBotExtension;
if (firstLoad) {
    MessageBotExtension.install('tutorial');
}