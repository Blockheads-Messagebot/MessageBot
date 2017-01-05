Object.assign(module.exports, [
    './alert',
    './notify',
].map(require));

var el = document.createElement('style');
el.innerHTML = INCLUDE_FILE('style.css');
document.head.appendChild(el);

document.body.innerHTML += INCLUDE_FILE('notifications.html');
