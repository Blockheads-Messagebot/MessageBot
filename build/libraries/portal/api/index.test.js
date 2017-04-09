"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const chai_1 = require("chai");
const nock = require("nock");
require("mocha");
const querystring = require("querystring");
describe('PortalApi', function () {
    let worldID = 111111;
    let scope;
    let api;
    beforeEach(function () {
        api = new index_1.PortalApi(worldID);
        scope = nock('http://portal.theblockheads.net');
        scope.post('/api', function (body) {
            return body.command == 'status';
        })
            .reply(200, {
            status: 'ok',
            worldStatus: 'online'
        });
    });
    describe('#getLists', function () {
        beforeEach(function () {
            scope.get('/worlds/lists/' + worldID)
                .replyWithFile(200, __dirname + '/lists.test.html');
        });
        it('Should return the adminlist', function () {
            return api.getLists().then(lists => {
                chai_1.expect(lists.adminlist).to.deep.equal([
                    'ADMIN1',
                    'ADMIN2',
                    'LOWERADMIN'
                ]);
            });
        });
        it('Should return the modlist', function () {
            return api.getLists().then(lists => {
                chai_1.expect(lists.modlist).to.deep.equal([
                    'MOD1',
                    'MOD2',
                    'LOWERMOD'
                ]);
            });
        });
        it('Should return the whitelist', function () {
            return api.getLists().then(lists => {
                chai_1.expect(lists.whitelist).to.deep.equal(['WHITELISTED']);
            });
        });
        it('Should return the blacklist', function () {
            return api.getLists().then(lists => {
                chai_1.expect(lists.blacklist).to.deep.equal(['BANNED', 'BANNED2']);
            });
        });
    });
    describe('#getOverview', function () {
        beforeEach(function () {
            scope.get('/worlds/' + worldID)
                .replyWithFile(200, __dirname + '/overview.test.html');
        });
        it('Should get the world name', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.name).to.equal('WORLDNAME');
            });
        });
        it('Should get the owner name', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.owner).to.equal('OWNERNAME');
            });
        });
        it('Should get the creation date', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.created.valueOf()).to.equal(0);
            });
        });
        it('Should get the last activity date', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.last_activity.valueOf()).to.equal(10 * 60 * 1000);
            });
        });
        it('Should get how long the server is credited', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.credit_until.valueOf()).to.equal(20 * 60 * 1000);
            });
        });
        it('Should get the server link', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.link).to.equal('http://theblockheads.net/join.php?id=6576223991974faf62774361d6cdd1cd');
            });
        });
        it('Should check if pvp is enabled', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.pvp).to.be.false;
            });
        });
        it('Should get the world privacy setting', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.privacy).to.equal('searchable');
            });
        });
        it('Should get the world size', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.size).to.equal('4x');
            });
        });
        it('Should check if the server is whitelisted', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.whitelist).to.be.true;
            });
        });
        it('Should get names of online players', function () {
            return api.getOverview().then(overview => {
                chai_1.expect(overview.online).to.deep.equal(['PLAYER']);
            });
        });
    });
    describe('#getLogs', function () {
        beforeEach(function () {
            scope.get('/worlds/logs/' + worldID)
                .reply(200, '');
        });
        it('Should return parsed logs', function () {
            return api.getLogs().then(lines => {
                // We aren't testing the actual parsing function here.
                chai_1.expect(lines).to.deep.equal([]);
            });
        });
    });
    describe('#send', function () {
        it('Should send the message', function (done) {
            scope.post('/api', function (body) {
                return body.command == 'send';
            })
                .reply(200, function (_url, body) {
                let b = querystring.parse(body);
                chai_1.expect(b.message).to.equal('SEND me!');
                done();
                return { status: 'ok' };
            });
            api.send('SEND me!');
        });
    });
});
