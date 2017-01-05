Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = INCLUDE_FILE('/dev/ui/notifications/style.css');
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = INCLUDE_FILE('/dev/ui/notifications/notifications.html');

document.body.appendChild(el);
