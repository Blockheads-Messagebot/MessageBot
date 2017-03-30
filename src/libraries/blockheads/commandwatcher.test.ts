import {WorldLists} from './types/world';
import {Player} from './player';
import {CommandWatcher} from './commandwatcher';

import {expect} from 'chai';
import 'mocha';

describe('CommandWatcher#listener', function() {
    let info = {ip: '', ips: [], joins: 0};

    let lists: WorldLists;
    let players: Map<string, Player>;
    let watcher: CommandWatcher;

    function getPlayer(name: string): Player {
        name = name.toLocaleLowerCase();
        if (players.has(name)) {
            return <Player>players.get(name);
        }
        return <Player>players.get('fake');
    }

    beforeEach(function() {
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
            //Generic fake player for /clear-list methods.
            ['fake', new Player('FAKE', info, lists)],
        ]);

        watcher = new CommandWatcher(lists, getPlayer);
    });


    describe('/ban & /ban-no-device', function() {
        let command = 'ban';

        it('Should be usable by admins on players', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'player'});

            expect(lists.blacklist).to.contain('PLAYER');
        });

        it('Should be usable by admins on mods', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'mod'});

            expect(lists.blacklist).to.contain('MOD');
        });

        it('Should remove banned players from the modlist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'mod'});

            expect(lists.modlist).not.to.contain('MOD');
        });

        it('Should remove banned players from the adminlist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'admin'});

            expect(lists.adminlist).not.to.contain('ADMIN');
        });

        it('Should remove banned players from the whitelist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'white'});

            expect(lists.whitelist).not.to.contain('WHITE');
        });

        it('Should not be usable by mods on admins', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'admin'});

            expect(lists.blacklist).not.to.contain('ADMIN');
        });

        it('Should not be usable by mods on mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'mod'});

            expect(lists.blacklist).not.to.contain('MOD');
        });

        it('Should not be usable by mods on players', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'player'});

            expect(lists.blacklist).to.contain('PLAYER');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'player'});

            expect(lists.blacklist).not.to.contain('PLAYER');
        });

        it('Should not ban the owner', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'owner'});

            expect(lists.blacklist).not.to.contain('OWNER');
        });
    });


    describe('/unban', function() {
        let command = 'unban';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'black'});

            expect(lists.blacklist).not.to.contain('BLACK');
        });

        it('Should be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'black'});

            expect(lists.blacklist).not.to.contain('BLACK');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'black'});

            expect(lists.blacklist).to.contain('BLACK');
        });
    });


    describe('/whitelist', function() {
        let command = 'whitelist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'player'});

            expect(lists.whitelist).to.contain('PLAYER');
        });

        it('Should be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'player'});

            expect(lists.whitelist).to.contain('PLAYER');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'player'});

            expect(lists.whitelist).not.to.contain('PLAYER');
        });

        it('Should remove players from the blacklist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'black'});

            expect(lists.blacklist).not.to.contain('BLACK');
        });
    });


    describe('/unwhitelist', function() {
        let command = 'unwhitelist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'WHITE'});

            expect(lists.whitelist).not.to.contain('WHITE');
        });

        it('Should be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'WHITE'});

            expect(lists.whitelist).not.to.contain('WHITE');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'WHITE'});

            expect(lists.whitelist).to.contain('WHITE');
        });
    });


    describe('/mod', function() {
        let command = 'mod';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'player'});

            expect(lists.modlist).to.contain('PLAYER');
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'player'});

            expect(lists.modlist).not.to.contain('PLAYER');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'player'});

            expect(lists.modlist).not.to.contain('PLAYER');
        });

        it('Should work on admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'admin'});

            expect(lists.modlist).to.contain('MOD');
        });

        it('Should remove players from the blacklist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'black'});

            expect(lists.blacklist).not.to.contain('BLACK');
        });
    });


    describe('/unmod', function() {
        let command = 'unmod';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'mod'});

            expect(lists.modlist).not.to.contain('MOD');
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'mod'});

            expect(lists.modlist).to.contain('MOD');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'mod'});

            expect(lists.modlist).to.contain('MOD');
        });

        it('Should not remove the name from the admin list', function() {
            lists.modlist.push('ADMIN');
            watcher.listener({player: getPlayer('admin'), command, args: 'admin'});

            expect(lists.adminlist).to.contain('ADMIN');
        });
    });


    describe('/admin', function() {
        let command = 'admin';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'player'});

            expect(lists.adminlist).to.contain('PLAYER');
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'player'});

            expect(lists.adminlist).not.to.contain('PLAYER');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'player'});

            expect(lists.adminlist).not.to.contain('PLAYER');
        });

        it('Should not remove mods who were promoted to admin', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'mod'});

            expect(lists.modlist).to.contain('MOD');
        });

        it('Should remove players from the blacklist', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'black'});

            expect(lists.blacklist).not.to.contain('BLACK');
        });
    });


    describe('/unadmin', function() {
        let command = 'unadmin';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: 'admin'});

            expect(lists.adminlist).not.to.contain('ADMIN');
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: 'admin'});

            expect(lists.adminlist).to.contain('ADMIN');
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: 'admin'});

            expect(lists.adminlist).to.contain('ADMIN');
        });

        it('Should not remove the name from the mod list', function() {
            lists.modlist.push('ADMIN');
            watcher.listener({player: getPlayer('admin'), command, args: 'admin'});

            expect(lists.modlist).to.contain('ADMIN');
        });
    });


    describe('/clear-blacklist', function() {
        let command = 'clear-blacklist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: ''});

            expect(lists.blacklist).to.be.empty;
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: ''});

            expect(lists.blacklist).not.to.be.empty;
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: ''});

            expect(lists.blacklist).not.to.be.empty;
        });
    });

    describe('/clear-whitelist', function() {
        let command = 'clear-whitelist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: ''});

            expect(lists.whitelist).to.be.empty;
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: ''});

            expect(lists.whitelist).not.to.be.empty;
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: ''});

            expect(lists.whitelist).not.to.be.empty;
        });
    });

    describe('/clear-modlist', function() {
        let command = 'clear-modlist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: ''});

            expect(lists.modlist).to.be.empty;
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: ''});

            expect(lists.modlist).not.to.be.empty;
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: ''});

            expect(lists.modlist).not.to.be.empty;
        });
    });

    describe('/clear-adminlist', function() {
        let command = 'clear-adminlist';

        it('Should be usable by admins', function() {
            watcher.listener({player: getPlayer('admin'), command, args: ''});

            expect(lists.adminlist).to.be.empty;
        });

        it('Should not be usable by mods', function() {
            watcher.listener({player: getPlayer('mod'), command, args: ''});

            expect(lists.adminlist).not.to.be.empty;
        });

        it('Should not be usable by players', function() {
            watcher.listener({player: getPlayer('player'), command, args: ''});

            expect(lists.adminlist).not.to.be.empty;
        });
    });
});
