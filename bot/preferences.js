var storage = require('../libs/storage');

const STORAGE_ID = 'mb_preferences';

var preferences = module.exports = storage.getObject(STORAGE_ID, {});

var prefsMap = [
    {type: 'number', key: 'announcementDelay', selector: '#mb_ann_delay', default: 10},
    {type: 'number', key: 'maxResponses', selector: '#mb_resp_max', default: 2},
    {type: 'boolean', key: 'regexTriggers', selector: '#mb_regex_triggers', default: false},
    {type: 'boolean', key: 'disableTrim', selector: '#mb_disable_trim', default: false},
    {type: 'boolean', key: 'notify', selector: '#mb_notify_message', default: true},
];


// Set & show preferences, using default if not set.
prefsMap.forEach(pref => {
    if (typeof preferences[pref.key] != pref.type) {
        preferences[pref.key] = pref.default;
    }

    let el = document.querySelector(pref.selector);
    switch (pref.type) {
        case 'boolean':
            el.checked = preferences[pref.key] ? 'checked' : '';
            break;
        default:
            el.value = preferences[pref.key];
    }
});


//Watch for changes
document.querySelector('#mb_settings').addEventListener('change', function save() {
    var getValue = (selector) => document.querySelector(selector).value;
    var getInt = (selector) => +getValue(selector);
    var getChecked = (selector) => document.querySelector(selector).checked;

    prefsMap.forEach(pref => {

        let func;
        switch (pref.type) {
            case 'boolean':
                func = getChecked;
                break;
            case 'number':
                func = getInt;
                break;
            default:
                func = getValue;
        }

        preferences[pref.key] = func(pref.selector);
    });

    storage.set(STORAGE_ID, preferences, false);
});
