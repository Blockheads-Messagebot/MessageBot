"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var chai_1 = require("chai");
var sinon = require("sinon");
var fs = require("fs");
require("mocha");
function checkResponses(server, handlers) {
    server.requests.forEach(function (request) {
        if (request.status == 200) {
            return; // Already responded.
        }
        try {
            for (var handlers_1 = __values(handlers), handlers_1_1 = handlers_1.next(); !handlers_1_1.done; handlers_1_1 = handlers_1.next()) {
                var handler = handlers_1_1.value;
                if (request.method == handler.method && request.url == handler.url && (handler.check == null || handler.check(request))) {
                    request.respond(200, handler.headers, handler.body);
                    if (handler.onRespond)
                        handler.onRespond(request);
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (handlers_1_1 && !handlers_1_1.done && (_a = handlers_1.return)) _a.call(handlers_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _a;
    });
}
function delay(time) {
    return new Promise(function (resolve) { return setTimeout(resolve, time); });
}
describe('PortalApi', function () {
    var worldID = 111111;
    var server;
    var api;
    var handlers;
    var respond = function (times) {
        if (times === void 0) { times = 1; }
        for (var i = 0; i < times; i++) {
            delay(50 * i).then(function () { return checkResponses(server, handlers); });
        }
    };
    var respondTwice = function () { return respond(2); };
    beforeEach(function () {
        api = new index_1.PortalApi(worldID);
        server = sinon.fakeServer.create();
        handlers = [];
        handlers.push({
            method: 'POST',
            url: '/api',
            check: function (request) { return request.requestBody.includes('command=status'); },
            headers: { "Content-Type": "application/json" },
            body: '{"status":"ok","worldStatus":"online"}'
        });
    });
    afterEach(function () {
        server.restore();
    });
    describe('getLists', function () {
        beforeEach(function () {
            handlers.push({
                method: 'GET',
                url: '/worlds/lists/' + worldID,
                body: fs.readFileSync(__dirname + '/lists.test.html', 'utf8')
            });
        });
        it('Should return the adminlist', function () {
            var req = api.getLists().then(function (lists) {
                chai_1.expect(lists.adminlist).to.deep.equal([
                    'ADMIN1',
                    'ADMIN2',
                    'LOWERADMIN'
                ]);
            });
            respondTwice();
            return req;
        });
        it('Should return the modlist', function () {
            var req = api.getLists().then(function (lists) {
                chai_1.expect(lists.modlist).to.deep.equal([
                    'MOD1',
                    'MOD2',
                    'LOWERMOD'
                ]);
            });
            respondTwice();
            return req;
        });
        it('Should return the whitelist', function () {
            var req = api.getLists().then(function (lists) {
                chai_1.expect(lists.whitelist).to.deep.equal(['WHITELISTED']);
            });
            respondTwice();
            return req;
        });
        it('Should return the blacklist', function () {
            var req = api.getLists().then(function (lists) {
                chai_1.expect(lists.blacklist).to.deep.equal(['BANNED', 'BANNED2']);
            });
            respondTwice();
            return req;
        });
    });
    describe('getOverview', function () {
        beforeEach(function () {
            handlers.push({
                method: 'GET',
                url: '/worlds/' + worldID,
                body: fs.readFileSync(__dirname + '/overview.test.html', 'utf8')
            });
        });
        it('Should get the world name', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.name).to.equal('WORLDNAME');
            });
            respondTwice();
            return req;
        });
        it('Should get the owner name', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.owner).to.equal('OWNERNAME');
            });
            respondTwice();
            return req;
        });
        it('Should get the creation date', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.created.valueOf()).to.equal(0);
            });
            respondTwice();
            return req;
        });
        it('Should get the last activity date', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.last_activity.valueOf()).to.equal(10 * 60 * 1000);
            });
            respondTwice();
            return req;
        });
        it('Should get how long the server is credited', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.credit_until.valueOf()).to.equal(20 * 60 * 1000);
            });
            respondTwice();
            return req;
        });
        it('Should get the server link', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.link).to.equal('http://theblockheads.net/join.php?id=6576223991974faf62774361d6cdd1cd');
            });
            respondTwice();
            return req;
        });
        it('Should check if pvp is enabled', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.pvp).to.be.false;
            });
            respondTwice();
            return req;
        });
        it('Should get the world privacy setting', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.privacy).to.equal('searchable');
            });
            respondTwice();
            return req;
        });
        it('Should get the world size', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.size).to.equal('4x');
            });
            respondTwice();
            return req;
        });
        it('Should check if the server is whitelisted', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.whitelist).to.be.true;
            });
            respondTwice();
            return req;
        });
        it('Should get names of online players', function () {
            var req = api.getOverview().then(function (overview) {
                chai_1.expect(overview.online).to.deep.equal(['PLAYER']);
            });
            respondTwice();
            return req;
        });
    });
    describe('getLogs', function () {
        beforeEach(function () {
            handlers.push({
                method: 'GET',
                url: '/worlds/logs/' + worldID,
                body: '',
            });
        });
        it('Should return parsed logs', function () {
            var req = api.getLogs().then(function (lines) {
                // We aren't testing the actual parsing function here.
                chai_1.expect(lines).to.deep.equal([]);
            });
            respondTwice();
            return req;
        });
    });
    describe('send', function () {
        it('Should send the message', function (done) {
            // This test could probably be improved, relying on timing is... not good.
            handlers.push({
                method: 'POST',
                url: '/api',
                check: function (req) { return req.requestBody.includes('command=send'); },
                body: JSON.stringify({ status: 'ok' }),
                onRespond: function (request) {
                    chai_1.expect(request.requestBody).to.include('message=SEND%20me!');
                    done();
                }
            });
            api.send('SEND me!');
            // The API only sends every 500 ms or so.
            delay(700).then(function () { return respond(); });
        });
    });
});
