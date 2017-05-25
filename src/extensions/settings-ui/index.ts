import { MessageBot } from '../../bot';
import { UIExtensionExports } from '../ui';

import * as fs from 'fs';

const settingDefaults: [string, string | number | boolean][] = [
    // General
    ['messages/announcementDelay', 10],
    ['messages/maxResponses', 3],
    ['console/logJoinIps', true],
    ['console/logUnparsedMessages', true],
    // Advanced
    ['messages/regexTriggers', false],
    ['messages/disableWhitespaceTrimming', false],
    ['splitMessages', false],
    ['splitToken', '<split>'],
];

MessageBot.registerExtension('settings-ui', function(ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI has been loaded.');
    }

    let settingsRoot = ex.bot.settings;
    let ui = ex.bot.getExports('ui') as UIExtensionExports;

    let tab = ui.addTab('Settings');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');

    for (let [key, def] of settingDefaults) {
        let el = tab.querySelector(`[data-target="${key}"]`) as HTMLInputElement;

        if (typeof def == 'boolean') {
            el.checked = settingsRoot.get(key, def);
        } else {
            el.value = String(settingsRoot.get(key, def));
        }
    }

    tab.addEventListener('input', () => {
        for (let [key, def] of settingDefaults) {
            let el = tab.querySelector(`[data-target="${key}"]`) as HTMLInputElement;

            if (typeof def == 'boolean') {
                settingsRoot.set(key, el.checked);
            } else if (typeof def == 'number') {
                settingsRoot.set(key, +el.value);
            } else {
                settingsRoot.set(key, el.value);
            }
        }
    });

    ex.uninstall = function() {
        ui.removeTab(tab);
    };
});
