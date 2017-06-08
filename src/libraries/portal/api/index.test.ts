import {PortalApi} from './index';

import {expect} from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import 'mocha';

type requestHandler = {
    method: 'GET' | 'POST',
    url: string,
    check?: (request: sinon.SinonFakeXMLHttpRequest) => boolean,
    headers?: any,
    body: string,
    onRespond?: (request: sinon.SinonFakeXMLHttpRequest) => void,
};

function checkResponses(server: sinon.SinonFakeServer, handlers: requestHandler[]) {
    server.requests.forEach(request => {
        if (request.status == 200) {
            return; // Already responded.
        }
        for (let handler of handlers) {

            if (request.method == handler.method && request.url == handler.url && (handler.check == null || handler.check(request))) {
                request.respond(200, handler.headers, handler.body);

                if (handler.onRespond) handler.onRespond(request);
                break;
            }
        }
    });
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

describe('PortalApi', function() {
    let worldID = 111111;
    let server: sinon.SinonFakeServer;
    let api: PortalApi;
    let handlers: requestHandler[];
    let respond = (times: number = 1) => {
        for (let i = 0; i < times; i++) {
            delay(50 * i).then(() => checkResponses(server, handlers));
        }
    };
    let respondTwice = () => respond(2);

    beforeEach(function() {
        api = new PortalApi(worldID);
        server = sinon.fakeServer.create();
        handlers = [];

        handlers.push({
            method: 'POST',
            url: '/api',
            check: request =>  request.requestBody.includes('command=status'),
            headers: { "Content-Type": "application/json" },
            body: '{"status":"ok","worldStatus":"online"}'
        });
    });

    afterEach(function() {
        server.restore();
    });

    describe('getLists', function() {
        beforeEach(function() {
            handlers.push({
                method: 'GET',
                url: '/worlds/lists/' + worldID,
                body: fs.readFileSync(__dirname + '/lists.test.html', 'utf8')
            });
        });

        it('Should return the adminlist', function() {
            let req = api.getLists().then(lists => {
                expect(lists.adminlist).to.deep.equal([
                    'ADMIN1',
                    'ADMIN2',
                    'LOWERADMIN'
                ]);
            });

            respondTwice();

            return req;
        });

        it('Should return the modlist', function() {
            let req = api.getLists().then(lists => {
                expect(lists.modlist).to.deep.equal([
                    'MOD1',
                    'MOD2',
                    'LOWERMOD'
                ]);
            });

            respondTwice();

            return req;
        });

        it('Should return the whitelist', function() {
            let req = api.getLists().then(lists => {
                expect(lists.whitelist).to.deep.equal(['WHITELISTED']);
            });

            respondTwice();

            return req;
        });

        it('Should return the blacklist', function() {
            let req = api.getLists().then(lists => {
                expect(lists.blacklist).to.deep.equal(['BANNED', 'BANNED2']);
            });

            respondTwice();

            return req;
        });
    });

    describe('getOverview', function() {
        beforeEach(function() {
            handlers.push({
                method: 'GET',
                url: '/worlds/' + worldID,
                body: fs.readFileSync(__dirname + '/overview.test.html', 'utf8')
            });
        });

        it('Should get the world name', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.name).to.equal('WORLDNAME');
            });

            respondTwice();

            return req;
        });

        it('Should get the owner name', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.owner).to.equal('OWNERNAME');
            });

            respondTwice();

            return req;
        });

        it('Should get the creation date', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.created.valueOf()).to.equal(0);
            });

            respondTwice();

            return req;
        });

        it('Should get the last activity date', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.last_activity.valueOf()).to.equal(10 * 60 * 1000);
            });

            respondTwice();

            return req;
        });

        it('Should get how long the server is credited', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.credit_until.valueOf()).to.equal(20 * 60 * 1000);
            });

            respondTwice();

            return req;
        });

        it('Should get the server link', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.link).to.equal('http://theblockheads.net/join.php?id=6576223991974faf62774361d6cdd1cd');
            });

            respondTwice();

            return req;
        });

        it('Should check if pvp is enabled', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.pvp).to.be.false;
            });

            respondTwice();

            return req;
        });

        it('Should get the world privacy setting', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.privacy).to.equal('searchable');
            });

            respondTwice();

            return req;
        });

        it('Should get the world size', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.size).to.equal('4x');
            });

            respondTwice();

            return req;
        });

        it('Should check if the server is whitelisted', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.whitelist).to.be.true;
            });

            respondTwice();

            return req;
        });

        it('Should get names of online players', function() {
            let req = api.getOverview().then(overview => {
                expect(overview.online).to.deep.equal(['PLAYER']);
            });

            respondTwice();

            return req;
        });
    });

    describe('getLogs', function() {
        beforeEach(function() {
            handlers.push({
                method: 'GET',
                url: '/worlds/logs/' + worldID,
                body: '',
            });
        });

        it('Should return parsed logs', function() {
            let req = api.getLogs().then(lines => {
                // We aren't testing the actual parsing function here.
                expect(lines).to.deep.equal([]);
            });

            respondTwice();

            return req;
        });
    });

    describe('send', function() {
        it('Should send the message', function(done) {
            // This test could probably be improved, relying on timing is... not good.

            handlers.push({
                method: 'POST',
                url: '/api',
                check: req => req.requestBody.includes('command=send'),
                body: JSON.stringify({status: 'ok'}),
                onRespond: (request) => {
                    expect(request.requestBody).to.include('message=SEND%20me!');
                    done();
                }
            });

            api.send('SEND me!');

            // The API only sends every 500 ms or so.
            delay(700).then(() => respond());
        });
    });
});
