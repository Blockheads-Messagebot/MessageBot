// Yes, this is a JS file. Typescript chokes otherwise since node-localstorage is not a Typescript module.

const config = {
    path: './localStorage'
};

const {LocalStorage} = require('node-localstorage');
global.localStorage = new LocalStorage(config.path);