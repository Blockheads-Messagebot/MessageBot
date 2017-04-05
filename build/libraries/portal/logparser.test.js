"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logparser_1 = require("./logparser");
const chai_1 = require("chai");
require("mocha");
describe('PortalLogParser#parse', function () {
    let parser;
    beforeEach(function () {
        parser = new logparser_1.PortalLogParser();
    });
    it('Should not mutate the passed array', function () {
        let messages = ['2016-11-27 19:28:49.280 blockheads_server161p1[11900] SERVER: Ah'];
        let clone = messages.slice(0);
        parser.parse(messages);
        chai_1.expect(messages).to.deep.equal(clone);
    });
    it('Should handle chat', function () {
        let message = '2016-11-27 19:28:49.280 blockheads_server161p1[11900] SERVER: Hi';
        let result = parser.parse([message]);
        chai_1.expect(result).to.deep.equal([{
                raw: message,
                timestamp: new Date('2016-11-27T19:28:49.280Z'),
                message: 'SERVER: Hi',
            }]);
    });
    it('Should handle join messages', function () {
        let message = '2015-11-11 04:10:04.694 blockheads_server161b3p1[24373] AIRSTEDDING - Player Connected PERSON | 0.0.0.0 | 8b0a44048f58988b486bdd0d245b22a8';
        let result = parser.parse([message]);
        chai_1.expect(result).to.deep.equal([{
                raw: message,
                timestamp: new Date('2015-11-11T04:10:04.694Z'),
                message: 'AIRSTEDDING - Player Connected PERSON | 0.0.0.0 | 8b0a44048f58988b486bdd0d245b22a8',
            }]);
    });
    it('Should handle multiline messages', function () {
        let lines = `2016-07-18 18:28:23.603 blockheads_server161p1[12844] SERVER:
/HELP - display this message.
/PLAYERS - list currently active players.`.split('\n');
        let result = parser.parse(lines);
        console.log(lines);
        chai_1.expect(result).to.deep.equal([{
                raw: lines.join('\n'),
                timestamp: new Date('2016-07-18T18:28:23.603Z'),
                message: `SERVER:
/HELP - display this message.
/PLAYERS - list currently active players.`
            }]);
    });
    it('Should handle multiple messages', function () {
        let messages = `2017-01-26 03:40:36.013 blockheads_server161p1[22438] AIRSTEDDING - Player Connected BIBLIOPHILE | 0.0.0.0 | 99d616273e72ffd7e2ec5e19a78f13af
2017-01-26 03:44:55.607 blockheads_server161p1[22438] SERVER: Hi
2017-01-26 04:29:52.643 blockheads_server161p1[22438] AIRSTEDDING - Client disconnected:99d616273e72ffd7e2ec5e19a78f13af
2017-01-26 04:29:52.643 blockheads_server161p1[22438] AIRSTEDDING - Player Disconnected BIBLIOPHILE`.split('\n');
        let parsed = parser.parse(messages);
        chai_1.expect(parsed).to.deep.equal([
            { raw: messages[0], timestamp: new Date(messages[0].substr(0, 23).replace(' ', 'T') + 'Z'), message: messages[0].substr(54) },
            { raw: messages[1], timestamp: new Date(messages[1].substr(0, 23).replace(' ', 'T') + 'Z'), message: messages[1].substr(54) },
            { raw: messages[2], timestamp: new Date(messages[2].substr(0, 23).replace(' ', 'T') + 'Z'), message: messages[2].substr(54) },
            { raw: messages[3], timestamp: new Date(messages[3].substr(0, 23).replace(' ', 'T') + 'Z'), message: messages[3].substr(54) },
        ]);
    });
});
