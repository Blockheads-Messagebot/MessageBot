"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Polyfill localStorage
const { LocalStorage } = require('node-localstorage');
global.localStorage = new LocalStorage('./localStorage');
const fs = require("fs");
fs.readFile('./config/import.json', 'utf8', function (err, data) {
    if (err) {
        console.log('Unable to open config/import.json');
        return;
    }
    let parsed;
    try {
        parsed = JSON.parse(data);
    }
    catch (err) {
        console.log('Unable to parse import file. Is it valid JSON?');
        return;
    }
    if (!parsed || typeof parsed != 'object') {
        parsed = {};
    }
    console.log('Importing config...');
    Object.keys(parsed).forEach(key => {
        localStorage.setItem(key, JSON.stringify(parsed[key]));
    });
    console.log('Config imported successfully!');
});
