const fs = require('fs');

Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css', 'utf8');
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = fs.readFileSync(__dirname + '/notifications.html', 'utf8');

document.body.appendChild(el);
