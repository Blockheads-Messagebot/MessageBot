"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = require("./player");
const chai_1 = require("chai");
require("mocha");
describe('Player', function () {
    let info;
    let lists;
    let players;
    let getPlayer = (name) => players.get(name) || players.get('fake');
    beforeEach(function () {
        info = { ip: '', ips: [], joins: 0 };
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
            ['server', new player_1.Player('SERVER', info, lists)],
            //Generic fake player for /clear-list methods.
            ['fake', new player_1.Player('FAKE', info, lists)],
        ]);
    });
    describe('#hasJoined', function () {
        it('Should return false if the player has never joined.', function () {
            chai_1.expect(getPlayer('player').hasJoined()).to.be.false;
        });
        it('Should return true if the player has joined.', function () {
            info.joins = 1;
            chai_1.expect(getPlayer('player').hasJoined()).to.be.true;
        });
    });
    describe('#getName', function () {
        it('Should return the name of the player', function () {
            chai_1.expect(getPlayer('player').getName()).to.equal('PLAYER');
        });
    });
    describe('#getIP', function () {
        it('Should return the IP of the player', function () {
            chai_1.expect(getPlayer('player').getIP()).to.equal('');
        });
    });
    describe('#getIPs', function () {
        it('Should return the IPs of the player', function () {
            chai_1.expect(getPlayer('player').getIPs()).to.deep.equal(info.ips);
        });
    });
    describe('#getJoins', function () {
        it('Should return the joins of the player', function () {
            info.joins = 42;
            chai_1.expect(getPlayer('player').getJoins()).to.deep.equal(info.joins);
        });
    });
    describe('#isOwner', function () {
        it('Should return false if the player is not the owner', function () {
            chai_1.expect(getPlayer('player').isOwner()).to.equal(false, 'players are not owners');
            chai_1.expect(getPlayer('admin').isOwner()).to.equal(false, 'admins are not owners');
            chai_1.expect(getPlayer('mod').isOwner()).to.equal(false, 'mods are not owners');
        });
        it('Should return true if the player is the owner', function () {
            chai_1.expect(getPlayer('owner').isOwner()).to.be.true;
        });
        it('Should return true if the player is the server', function () {
            chai_1.expect(getPlayer('server').isOwner()).to.be.true;
        });
    });
    describe('#isAdmin', function () {
        it('Should return false for players', function () {
            chai_1.expect(getPlayer('player').isAdmin()).to.be.false;
        });
        it('Should return false for mods', function () {
            chai_1.expect(getPlayer('mod').isAdmin()).to.be.false;
        });
        it('Should return true for admins', function () {
            chai_1.expect(getPlayer('admin').isAdmin()).to.be.true;
        });
        it('Should return true for the owner', function () {
            chai_1.expect(getPlayer('owner').isAdmin()).to.be.true;
        });
        it('Should return true for the server', function () {
            chai_1.expect(getPlayer('server').isAdmin()).to.be.true;
        });
    });
    describe('#isMod', function () {
        it('Should return false for players', function () {
            chai_1.expect(getPlayer('player').isMod()).to.be.false;
        });
        it('Should return true for mods', function () {
            chai_1.expect(getPlayer('mod').isMod()).to.be.true;
        });
        it('Should return false for mods who are also admins', function () {
            lists.modlist.push('ADMIN');
            chai_1.expect(getPlayer('admin').isMod()).to.be.false;
        });
        it('Should return false for mods who are also owners', function () {
            lists.modlist.push('OWNER', 'SERVER');
            chai_1.expect(getPlayer('owner').isMod()).to.be.false;
            chai_1.expect(getPlayer('server').isMod()).to.be.false;
        });
        it('Should return false for admins', function () {
            chai_1.expect(getPlayer('admin').isMod()).to.be.false;
        });
        it('Should return false for owners', function () {
            chai_1.expect(getPlayer('owner').isMod()).to.be.false;
            chai_1.expect(getPlayer('server').isMod()).to.be.false;
        });
    });
    describe('#isStaff', function () {
        it('Should return false for players', function () {
            chai_1.expect(getPlayer('player').isStaff()).to.be.false;
        });
        it('Should return true for mods', function () {
            chai_1.expect(getPlayer('mod').isStaff()).to.be.true;
        });
        it('Should return true for admins', function () {
            chai_1.expect(getPlayer('admin').isStaff()).to.be.true;
        });
        it('Should return true for owners', function () {
            chai_1.expect(getPlayer('owner').isStaff()).to.be.true;
            chai_1.expect(getPlayer('server').isStaff()).to.be.true;
        });
    });
    describe('#isWhitelisted', function () {
        it('Should return false for players who are not whitelisted', function () {
            chai_1.expect(getPlayer('player').isWhitelisted()).to.be.false;
        });
        it('Should return true for whitelisted players', function () {
            chai_1.expect(getPlayer('white').isWhitelisted()).to.be.true;
        });
        it('Should return true for mods', function () {
            chai_1.expect(getPlayer('mod').isStaff()).to.be.true;
        });
        it('Should return true for admins', function () {
            chai_1.expect(getPlayer('admin').isStaff()).to.be.true;
        });
        it('Should return true for owners', function () {
            chai_1.expect(getPlayer('owner').isStaff()).to.be.true;
            chai_1.expect(getPlayer('server').isStaff()).to.be.true;
        });
    });
    describe('#isBanned', function () {
        it('Should return false for players who are not banned', function () {
            chai_1.expect(getPlayer('player').isBanned()).to.be.false;
        });
        it('Should return true for banned players', function () {
            chai_1.expect(getPlayer('black').isBanned()).to.be.true;
        });
    });
});
