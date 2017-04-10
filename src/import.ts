// Polyfill localStorage
const {LocalStorage} = require('node-localstorage');
(global as any).localStorage = new LocalStorage('./localStorage');

import * as fs from 'fs';

fs.readFile('./config/import.json', 'utf8', function(err, data) {
    if (err) {
        console.log('Unable to open config/import.json');
        return;
    }

    let parsed: {[key: string]: any};
    try {
        parsed = JSON.parse(data);
    } catch (err) {
        console.log('Unable to parse import file. Is it valid JSON?');
        return;
    }
    if (!parsed || typeof parsed != 'object') { //could be null.
        parsed = {};
    }

    console.log('Importing config...');

    Object.keys(parsed).forEach(key => {
        localStorage.setItem(key, JSON.stringify(parsed[key]));
    });

    console.log('Config imported successfully!');
});
