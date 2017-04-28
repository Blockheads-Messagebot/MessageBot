import {MessageBot, Settings} from '../../bot';

interface settingDescription {
    key: string;
    title: string;
    default: boolean | string | number;
    description?: string;
}

MessageBot.registerExtension('settings', function(ex) {
    let describe = ex.export('describe', function(settings: Settings, descriptions: settingDescription[]) {
        if (ex.isNode) {
            return; // No way to change settings without a browser.
        }

        descriptions.forEach(item => {
            let value = settings.get(item.key, item.default);
            switch (typeof value) {
                case 'string':

                    break;
                case 'number':
                    break;
                case 'boolean':

            }
        });
    });

    describe(ex.bot.settings, []);
});
