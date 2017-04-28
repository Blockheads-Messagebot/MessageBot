"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var player_1 = require("./player");
var commandwatcher_1 = require("./commandwatcher");
var chai_1 = require("chai");
require("mocha");
describe('CommandWatcher#listener', function () {
    var info = { ip: '', ips: [], joins: 0 };
    var lists;
    var players;
    var watcher;
    function getPlayer(name) {
        name = name.toLocaleLowerCase();
        if (players.has(name)) {
            return players.get(name);
        }
        return players.get('fake');
    }
    beforeEach(function () {
        lists = {
            adminlist: ['ADMIN'],
            modlist: ['MOD'],
            whitelist: ['WHITE'],
            blacklist: ['BLACK'],
        };
        players = new Map([
            ['player', new player_1.Player('PLAYER', info, lists)],
            ['admin', new player_1.Player('ADMIN', info, lists)],
            ['mod', new player_1.Player('MOD', info, lists)],
            ['white', new player_1.Player('WHITE', info, lists)],
            ['black', new player_1.Player('BLACK', info, lists)],
            ['owner', new player_1.Player('OWNER', { ip: '', ips: [], joins: 0, owner: true }, lists)],
            //Generic fake player for /clear-list methods.
            ['fake', new player_1.Player('FAKE', info, lists)],
        ]);
        watcher = new commandwatcher_1.CommandWatcher(lists, getPlayer);
    });
    describe('/ban & /ban-no-device', function () {
        var command = 'ban';
        it('Should be usable by admins on players', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'player' });
            chai_1.expect(lists.blacklist).to.contain('PLAYER');
        });
        it('Should be usable by admins on mods', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'mod' });
            chai_1.expect(lists.blacklist).to.contain('MOD');
        });
        it('Should remove banned players from the modlist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'mod' });
            chai_1.expect(lists.modlist).not.to.contain('MOD');
        });
        it('Should remove banned players from the adminlist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'admin' });
            chai_1.expect(lists.adminlist).not.to.contain('ADMIN');
        });
        it('Should remove banned players from the whitelist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'white' });
            chai_1.expect(lists.whitelist).not.to.contain('WHITE');
        });
        it('Should not be usable by mods on admins', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'admin' });
            chai_1.expect(lists.blacklist).not.to.contain('ADMIN');
        });
        it('Should not be usable by mods on mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'mod' });
            chai_1.expect(lists.blacklist).not.to.contain('MOD');
        });
        it('Should not be usable by mods on players', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'player' });
            chai_1.expect(lists.blacklist).to.contain('PLAYER');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'player' });
            chai_1.expect(lists.blacklist).not.to.contain('PLAYER');
        });
        it('Should not ban the owner', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'owner' });
            chai_1.expect(lists.blacklist).not.to.contain('OWNER');
        });
    });
    describe('/unban', function () {
        var command = 'unban';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).not.to.contain('BLACK');
        });
        it('Should be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).not.to.contain('BLACK');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).to.contain('BLACK');
        });
    });
    describe('/whitelist', function () {
        var command = 'whitelist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'player' });
            chai_1.expect(lists.whitelist).to.contain('PLAYER');
        });
        it('Should be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'player' });
            chai_1.expect(lists.whitelist).to.contain('PLAYER');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'player' });
            chai_1.expect(lists.whitelist).not.to.contain('PLAYER');
        });
        it('Should remove players from the blacklist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).not.to.contain('BLACK');
        });
    });
    describe('/unwhitelist', function () {
        var command = 'unwhitelist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'WHITE' });
            chai_1.expect(lists.whitelist).not.to.contain('WHITE');
        });
        it('Should be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'WHITE' });
            chai_1.expect(lists.whitelist).not.to.contain('WHITE');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'WHITE' });
            chai_1.expect(lists.whitelist).to.contain('WHITE');
        });
    });
    describe('/mod', function () {
        var command = 'mod';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'player' });
            chai_1.expect(lists.modlist).to.contain('PLAYER');
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'player' });
            chai_1.expect(lists.modlist).not.to.contain('PLAYER');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'player' });
            chai_1.expect(lists.modlist).not.to.contain('PLAYER');
        });
        it('Should work on admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'admin' });
            chai_1.expect(lists.modlist).to.contain('MOD');
        });
        it('Should remove players from the blacklist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).not.to.contain('BLACK');
        });
    });
    describe('/unmod', function () {
        var command = 'unmod';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'mod' });
            chai_1.expect(lists.modlist).not.to.contain('MOD');
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'mod' });
            chai_1.expect(lists.modlist).to.contain('MOD');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'mod' });
            chai_1.expect(lists.modlist).to.contain('MOD');
        });
        it('Should not remove the name from the admin list', function () {
            lists.modlist.push('ADMIN');
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'admin' });
            chai_1.expect(lists.adminlist).to.contain('ADMIN');
        });
    });
    describe('/admin', function () {
        var command = 'admin';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'player' });
            chai_1.expect(lists.adminlist).to.contain('PLAYER');
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'player' });
            chai_1.expect(lists.adminlist).not.to.contain('PLAYER');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'player' });
            chai_1.expect(lists.adminlist).not.to.contain('PLAYER');
        });
        it('Should not remove mods who were promoted to admin', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'mod' });
            chai_1.expect(lists.modlist).to.contain('MOD');
        });
        it('Should remove players from the blacklist', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'black' });
            chai_1.expect(lists.blacklist).not.to.contain('BLACK');
        });
    });
    describe('/unadmin', function () {
        var command = 'unadmin';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'admin' });
            chai_1.expect(lists.adminlist).not.to.contain('ADMIN');
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: 'admin' });
            chai_1.expect(lists.adminlist).to.contain('ADMIN');
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: 'admin' });
            chai_1.expect(lists.adminlist).to.contain('ADMIN');
        });
        it('Should not remove the name from the mod list', function () {
            lists.modlist.push('ADMIN');
            watcher.listener({ player: getPlayer('admin'), command: command, args: 'admin' });
            chai_1.expect(lists.modlist).to.contain('ADMIN');
        });
    });
    describe('/clear-blacklist', function () {
        var command = 'clear-blacklist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: '' });
            chai_1.expect(lists.blacklist).to.be.empty;
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: '' });
            chai_1.expect(lists.blacklist).not.to.be.empty;
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: '' });
            chai_1.expect(lists.blacklist).not.to.be.empty;
        });
    });
    describe('/clear-whitelist', function () {
        var command = 'clear-whitelist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: '' });
            chai_1.expect(lists.whitelist).to.be.empty;
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: '' });
            chai_1.expect(lists.whitelist).not.to.be.empty;
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: '' });
            chai_1.expect(lists.whitelist).not.to.be.empty;
        });
    });
    describe('/clear-modlist', function () {
        var command = 'clear-modlist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: '' });
            chai_1.expect(lists.modlist).to.be.empty;
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: '' });
            chai_1.expect(lists.modlist).not.to.be.empty;
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: '' });
            chai_1.expect(lists.modlist).not.to.be.empty;
        });
    });
    describe('/clear-adminlist', function () {
        var command = 'clear-adminlist';
        it('Should be usable by admins', function () {
            watcher.listener({ player: getPlayer('admin'), command: command, args: '' });
            chai_1.expect(lists.adminlist).to.be.empty;
        });
        it('Should not be usable by mods', function () {
            watcher.listener({ player: getPlayer('mod'), command: command, args: '' });
            chai_1.expect(lists.adminlist).not.to.be.empty;
        });
        it('Should not be usable by players', function () {
            watcher.listener({ player: getPlayer('player'), command: command, args: '' });
            chai_1.expect(lists.adminlist).not.to.be.empty;
        });
    });
});
