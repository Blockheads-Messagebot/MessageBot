import {MessageBot} from '../../bot';
import {Player} from '../../libraries/blockheads/player';

import { ConsoleExtensionExports } from './index';
import { UIExtensionExports } from '../ui';

import * as fs from 'fs';

MessageBot.registerExtension('console', function(ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension should only be loaded in a browser, and must be loaded after the UI is loaded.');
    }
    let ui = ex.bot.getExports('ui') as UIExtensionExports;

    // Create the tab.
    let style = document.createElement('style');
    style.textContent = require('./style.scss').css;
    document.head.appendChild(style);

    let tab = ui.addTab('Console');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');

    let chatUl = tab.querySelector('ul') as HTMLUListElement;
    let template = tab.querySelector('template') as HTMLTemplateElement;

    // Handle sending
    let input = tab.querySelector('input') as HTMLInputElement;
    function userSend() {
        if (input.value.startsWith('/')) {
            consoleExports.log(input.value);
        }
        world.send(input.value);
        input.value = '';
    }
    input.addEventListener('keyup', event => {
        if (event.key == 'Enter') {
            userSend();
        }
    });
    (tab.querySelector('button') as HTMLButtonElement).addEventListener('click', userSend);

    // Autoscroll when new chat is added to the page, unless we are scrolled up.
    new MutationObserver(function(events) {
        // Each line adds 24 pixels to the page
        // let totalAdded = events.length * 24;
        console.log(events.length);
    }).observe(chatUl, {childList: true, subtree: true});

    // Add a message to the page
    function addPlayerMessage(player: Player, message: string): void {
        if (!message.length) return;

        let messageClass = 'player';
        if (player.isAdmin()) messageClass = 'admin';
        if (player.isMod()) messageClass = 'mod';

        ui.buildTemplate(template, chatUl, [
            {selector: 'li', 'class': messageClass},
            {selector: 'span:first-child', text: player.getName()},
            {selector: 'span:last-child', text: ': ' + message}
        ]);
    }
    function addGenericMessage(message: string): void {
        if (!message.length) return;

        let li = document.createElement('li');
        li.textContent = message;
        chatUl.appendChild(li);
    }

    // Export required functions
    let consoleExports: ConsoleExtensionExports = {
        log: (message: string) => addPlayerMessage(world.getPlayer('SERVER'), message)
    };
    ex.exports = consoleExports;

    function logJoins(player: Player) {
        if (ex.settings.get('logJoinIps', true)) {
            consoleExports.log(`${player.getName()} (${player.getIP()}) joined.`);
        } else {
            consoleExports.log(`${player.getName()} joined.`);
        }

    }
    world.onJoin.sub(logJoins);

    function logLeaves(player: Player) {
        consoleExports.log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);

    function logMessages({player, message}: {player: Player, message: string}) {
        addPlayerMessage(player, message);
    }
    world.onMessage.sub(logMessages);

    function logOther(message: string) {
        if (ex.settings.get('logUnparsedMessages', true)) {
            addGenericMessage(message);
        }
    }
    world.onOther.sub(logOther);

    ex.uninstall = function() {
        ui.removeTab(tab);
        style.remove();
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
        world.onMessage.unsub(logMessages);
        world.onOther.unsub(logOther);
    };
});
