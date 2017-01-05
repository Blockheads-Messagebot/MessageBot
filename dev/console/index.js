const self = module.exports = require('./exports');

const layout = require('../layout');
const hook = require('../libraries/hook');
const world = require('../libraries/world');

var tab = layout.addTab('Console');
tab.innerHTML = '<style>' +
    INCLUDE_FILE('/dev/console/style.css') +
    '</style>' +
    INCLUDE_FILE('/dev/console/tab.html');

hook.listen('world.other', function(message) {
    self.write(message, undefined, 'other');
});

hook.listen('world.message', function(name, message) {
    let msgClass = 'player';
    if (world.isStaff(name)) {
        msgClass = 'staff';
        if (world.isMod(name)) {
            msgClass += ' mod';
        } else {
            //Has to be admin
            msgClass += ' admin';
        }
    }
    if (message.startsWith('/')) {
        msgClass += ' command';
    }
    self.write(message, name, msgClass);
});

hook.listen('world.serverchat', function(message) {
    self.write(message, 'SERVER', 'admin');
});

hook.listen('world.send', function(message) {
    if (message.startsWith('/')) {
        self.write(message, 'SERVER', 'admin command');
    }
});

//Message handlers
hook.listen('world.join', function handlePlayerJoin(name, ip) {
    self.write(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');
});

hook.listen('world.leave', function handlePlayerLeave(name) {
    self.write(`${name} has left the server`, 'SERVER', `leave world admin`);
});
