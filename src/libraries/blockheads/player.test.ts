import {WorldLists} from './types/world';
import {Player} from './player';

import {expect} from 'chai';
import 'mocha';

describe('Player', function() {
    let info: {ip: string, ips: string[], joins: number, owner?: boolean};
    let lists: WorldLists;
    let players: Map<string, Player>;

    let getPlayer = (name: string): Player => players.get(name) || <Player>players.get('fake');

    beforeEach(function() {
        info = {ip: '', ips: [], joins: 0};
        lists = {
            adminlist: ['ADMIN'],
            modlist: ['MOD'],
            whitelist: ['WHITE'],
            blacklist: ['BLACK'],
        };

        players = new Map<string, Player>([
            ['player', new Player('PLAYER', info, lists)],
            ['admin', new Player('ADMIN', info, lists)],
            ['mod', new Player('MOD', info, lists)],
            ['white', new Player('WHITE', info, lists)],
            ['black', new Player('BLACK', info, lists)],
            ['owner', new Player('OWNER', {ip: '', ips: [], joins: 0, owner: true}, lists)],
            ['server', new Player('SERVER', info, lists)],
            //Generic fake player for /clear-list methods.
            ['fake', new Player('FAKE', info, lists)],
        ]);
    });

    describe('hasJoined', function() {
       it('Should return false if the player has never joined.', function() {
           expect(getPlayer('player').hasJoined()).to.be.false;
       });

       it('Should return true if the player has joined.', function() {
           info.joins = 1;

           expect(getPlayer('player').hasJoined()).to.be.true;
       });
    });

    describe('getName', function() {
        it('Should return the name of the player', function() {
            expect(getPlayer('player').getName()).to.equal('PLAYER');
        });
    });

    describe('getIP', function() {
        it('Should return the IP of the player', function() {
            expect(getPlayer('player').getIP()).to.equal('');
        });
    });

    describe('getIPs', function() {
        it('Should return the IPs of the player', function() {
            expect(getPlayer('player').getIPs()).to.deep.equal(info.ips);
        });
    });

    describe('getJoins', function() {
        it('Should return the joins of the player', function() {
            info.joins = 42;
            expect(getPlayer('player').getJoins()).to.deep.equal(info.joins);
        });
    });

    describe('isOwner', function() {
        it('Should return false if the player is not the owner', function() {
            expect(getPlayer('player').isOwner()).to.equal(false, 'players are not owners');
            expect(getPlayer('admin').isOwner()).to.equal(false, 'admins are not owners');
            expect(getPlayer('mod').isOwner()).to.equal(false, 'mods are not owners');
        });

        it('Should return true if the player is the owner', function() {
            expect(getPlayer('owner').isOwner()).to.be.true;
        });

        it('Should return true if the player is the server', function() {
            expect(getPlayer('server').isOwner()).to.be.true;
        });
    });

    describe('isAdmin', function() {
        it('Should return false for players', function() {
            expect(getPlayer('player').isAdmin()).to.be.false;
        });

        it('Should return false for mods', function() {
            expect(getPlayer('mod').isAdmin()).to.be.false;
        });

        it('Should return true for admins', function() {
            expect(getPlayer('admin').isAdmin()).to.be.true;
        });

        it('Should return true for the owner', function() {
            expect(getPlayer('owner').isAdmin()).to.be.true;
        });

        it('Should return true for the server', function() {
            expect(getPlayer('server').isAdmin()).to.be.true;
        });
    });

    describe('isMod', function() {
        it('Should return false for players', function() {
            expect(getPlayer('player').isMod()).to.be.false;
        });

        it('Should return true for mods', function() {
            expect(getPlayer('mod').isMod()).to.be.true;
        });

        it('Should return false for mods who are also admins', function() {
            lists.modlist.push('ADMIN');
            expect(getPlayer('admin').isMod()).to.be.false;
        });

        it('Should return false for mods who are also owners', function() {
            lists.modlist.push('OWNER', 'SERVER');
            expect(getPlayer('owner').isMod()).to.be.false;
            expect(getPlayer('server').isMod()).to.be.false;
        });

        it('Should return false for admins', function() {
            expect(getPlayer('admin').isMod()).to.be.false;
        });

        it('Should return false for owners', function() {
            expect(getPlayer('owner').isMod()).to.be.false;
            expect(getPlayer('server').isMod()).to.be.false;
        });
    });

    describe('isStaff', function() {
        it('Should return false for players', function() {
            expect(getPlayer('player').isStaff()).to.be.false;
        });

        it('Should return true for mods', function() {
            expect(getPlayer('mod').isStaff()).to.be.true;
        });

        it('Should return true for admins', function() {
            expect(getPlayer('admin').isStaff()).to.be.true;
        });

        it('Should return true for owners', function() {
            expect(getPlayer('owner').isStaff()).to.be.true;
            expect(getPlayer('server').isStaff()).to.be.true;
        });
    });

    describe('isWhitelisted', function() {
        it('Should return false for players who are not whitelisted', function() {
            expect(getPlayer('player').isWhitelisted()).to.be.false;
        });

        it('Should return true for whitelisted players', function() {
            expect(getPlayer('white').isWhitelisted()).to.be.true;
        });

        it('Should return true for mods', function() {
            expect(getPlayer('mod').isStaff()).to.be.true;
        });

        it('Should return true for admins', function() {
            expect(getPlayer('admin').isStaff()).to.be.true;
        });

        it('Should return true for owners', function() {
            expect(getPlayer('owner').isStaff()).to.be.true;
            expect(getPlayer('server').isStaff()).to.be.true;
        });
    });

    describe('isBanned', function() {
        it('Should return false for players who are not banned', function() {
            expect(getPlayer('player').isBanned()).to.be.false;
        });

        it('Should return true for banned players', function() {
            expect(getPlayer('black').isBanned()).to.be.true;
        });
    });
});
