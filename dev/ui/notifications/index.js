const fs = require('fs');

Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css');
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = fs.readFileSync(__dirname + '/notifications.html');

document.body.appendChild(el);
