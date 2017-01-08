const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');
const settings = require('app/settings');
const fs = require('fs');

const STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = fs.readFileSync(__dirname + '/tab.html');

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.message', checkTriggers),
};

var triggerMessages = storage.getObject(STORAGE_ID, []);
triggerMessages.forEach(addMessage);

/**
 * Adds a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#tTemplate', '#tMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '.t', value: msg.trigger || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Saves the current trigger messages.
 */
function save() {
    triggerMessages = [];
    Array.from(tab.querySelectorAll('#tMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value || !container.querySelector('.t').value) {
            return;
        }

        triggerMessages.push({
            message: container.querySelector('.m').value,
            trigger: container.querySelector('.t').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
        });
    });

    storage.set(STORAGE_ID, triggerMessages);
}

/**
 * Checks a trigger against a message to see if it matches.
 *
 * @param {string} trigger the trigger to try to match
 * @param {string} message
 */
function triggerMatch(trigger, message) {
    if (settings.regexTriggers) {
        try {
            return new RegExp(trigger, 'i').test(message);
        } catch (e) {
            ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);
            return false;
        }
    }
    return new RegExp(
            trigger
                .replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1")
                .replace(/\*/g, ".*"),
            'i'
        ).test(message);
}

/**
 * Function used to check incoming player messages for triggers
 *
 * @param {string} name the player's name
 * @param {string} message
 */
function checkTriggers(name, message) {
    var totalAllowed = settings.maxResponses;
    triggerMessages.forEach(msg => {
        if (totalAllowed && helpers.checkJoinsAndGroup(name, msg) && triggerMatch(msg.trigger, message)) {
            helpers.buildAndSendMessage(msg.message, name);
            totalAllowed--;
        }
    });
}
