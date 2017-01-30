const fs = require('fs');

var el = document.createElement('div');
el.innerHTML = fs.readFileSync(__dirname + '/notifications.html', 'utf8');
document.body.appendChild(el);

el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css', 'utf8');
document.head.appendChild(el);

Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);
