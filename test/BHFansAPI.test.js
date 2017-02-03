/*jshint
    jasmine: true,
    unused: true
*/

const api = require('libraries/bhfansapi');

describe('bhfansapi.getStore', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should return a promise', function() {
        expect(api.getStore(true)).toEqual(jasmine.any(Promise));
    });

    it('Should resolve with an object', function(done) {
        var request = api.getStore(true);

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '200',
            responseText: '{"status":"ok","extensions":[]}',
        });

        request
            .then(function(data) {
                expect(data).toEqual({status: 'ok', extensions: []});
                done();
            })
            .catch(function() {
                fail('Should not have thrown.');
            });
    });

    it('Should cache calls.', function(done) {
        var request = api.getStore(true);

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '200',
            responseText: '{"status":"ok","extensions":[]}',
        });

        request
            .then(function() {
                var secondRequest = api.getStore();

                expect(request).toBe(secondRequest);
                done();
            });
    });
});

describe('bhfansapi.getExtensionInfo', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should return a promise', function() {
        expect(api.getExtensionInfo('id')).toEqual(jasmine.any(Promise));
    });

    it('Should send the extension id', function() {
        api.getExtensionInfo('id2');

        expect(jasmine.Ajax.requests.mostRecent().url).toContain('id2');
    });
});

describe('bhfansapi.reportError', function() {
    var err = new Error('ErrorMessage');
    err.filename = 'some_file.js';
    err.lineno = 42;
    err.colno = 55;
    err.stack = 'stackTrace';

    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should include the message', function() {
        api.reportError(err);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain(err.message);
    });

    it('Should include the filename', function() {
        api.reportError(err);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain(err.filename);
    });

    it('Should include the line number', function() {
        api.reportError(err);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain(err.lineno);
    });

    it('Should include the column number', function() {
        api.reportError(err);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain(err.colno);
    });

    it('Should include the stack', function() {
        api.reportError(err);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain(err.stack);
    });
});
