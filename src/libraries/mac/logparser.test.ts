import {MacLogParser as LogParser} from './logparser';

import {expect} from 'chai';
import 'mocha';

describe('MacLogParser#parse', function() {
    let parser: LogParser;

    beforeEach(function() {
        parser = new LogParser('GEM TREES!');
    });

    it('Does not mutate the passed array', function() {
        let messages = ['Apr  1 2017 14:49:24 biblios-Mac BlockheadsServer[1304]: GEM TREES! - SERVER: Hi'];
        let clone = messages.slice(0);
        parser.parse(messages);

        expect(messages).to.deep.equal(clone);
    })

    it('Should handle chat', function() {
        let message = 'Apr  1 2017 14:49:24 biblios-Mac BlockheadsServer[1304]: GEM TREES! - SERVER: Hi';
        let result = parser.parse([message]);

        expect(result).to.deep.equal([{
            raw: message,
            timestamp: new Date('Apr  1 2017 14:49:24'),
            message: 'SERVER: Hi',
        }]);
    });

    it('Should handle join messages', function() {
        let message = 'Apr  1 2017 14:49:31 biblios-Mac BlockheadsServer[1304]: GEM TREES! - Player Connected BIBLIOPHILE | 172.16.32.11 | 99d616273e72ffd7e2ec5e19a78f13af';
        let result = parser.parse([message]);

        expect(result).to.deep.equal([{
            raw: message,
            timestamp: new Date('Apr  1 2017 14:49:31'),
            message: 'Player Connected BIBLIOPHILE | 172.16.32.11 | 99d616273e72ffd7e2ec5e19a78f13af',
        }]);
    });

    it('Should handle multiline messages', function() {
        let lines = [
            `Apr  1 2017 18:06:06 biblios-Mac BlockheadsServer[1304]: GEM TREES! - SERVER:`,
            `\t/HELP - display this message.`,
            `\t/PLAYERS - list currently active players.`
        ];
        let result = parser.parse(lines);
        console.log(lines);
        expect(result).to.deep.equal([{
            raw: lines.join('\n'),
            timestamp: new Date('Apr  1 2017 18:06:06'),
            message: `SERVER:
	/HELP - display this message.
	/PLAYERS - list currently active players.`
        }]);
    });

    it('Should handle multiple messages', function() {
        let messages = `Apr  1 2017 15:19:43 biblios-Mac BlockheadsServer[1304]: GEM TREES! - Player Connected BIBLIOPHILE | 192.168.14.12 | 99d616273e72ffd7e2ec5e19a78f13ad
Apr  1 2017 15:19:44 biblios-Mac BlockheadsServer[1304]: GEM TREES! - SERVER: Welcome BIBLIOPHILE!
Apr  1 2017 15:19:51 biblios-Mac BlockheadsServer[1304]: GEM TREES! - BIBLIOPHILE: Hello
Apr  1 2017 15:19:55 biblios-Mac BlockheadsServer[1304]: GEM TREES! - BIBLIOPHILE: Chat works!
Apr  1 2017 15:27:39 biblios-Mac BlockheadsServer[1304]: GEM TREES! - Client disconnected:99d616273e72ffd7e2ec5e19a78f13ad
Apr  1 2017 15:27:39 biblios-Mac BlockheadsServer[1304]: GEM TREES! - Player Disconnected BIBLIOPHILE`.split('\n');

        let parsed = parser.parse(messages);

        expect(parsed).to.deep.equal([
            {raw: messages[0], timestamp: new Date(messages[0].substr(0, 20)), message: messages[0].substr(70)},
            {raw: messages[1], timestamp: new Date(messages[1].substr(0, 20)), message: messages[1].substr(70)},
            {raw: messages[2], timestamp: new Date(messages[2].substr(0, 20)), message: messages[2].substr(70)},
            {raw: messages[3], timestamp: new Date(messages[3].substr(0, 20)), message: messages[3].substr(70)},
            {raw: messages[4], timestamp: new Date(messages[4].substr(0, 20)), message: messages[4].substr(70)},
            {raw: messages[5], timestamp: new Date(messages[5].substr(0, 20)), message: messages[5].substr(70)},
        ]);
    });
});
