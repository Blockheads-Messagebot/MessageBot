/*jshint
    jasmine: true
*/

var ajax = require('libraries/ajax');

describe('ajax.xhr', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should return a promise', function() {
        var request = ajax.xhr('GET');

        expect(request).toEqual(jasmine.any(Promise));
    });

    it('Should use the passed method', function() {
        ajax.xhr('POST');

        expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST');
    });

    it('Should use the passed URL', function() {
        ajax.xhr('GET', '/some/url');

        expect(jasmine.Ajax.requests.mostRecent().url).toEqual('/some/url');
    });

    it('Should encode and use passed parameters', function() {
        ajax.xhr('POST', '/', {param: 't%est'});

        expect(jasmine.Ajax.requests.mostRecent().params).toEqual('param=t%25est');
    });

    it('Should reject on 404', function(done) {
        var request = ajax.xhr('GET');

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '404',
        });

        request
            .then(function() {
                fail('The request should have rejected.');
            })
            .catch(function() {
                done();
            });
    });

    it('Should reject on network errors', function(done) {
        var request = ajax.xhr('GET');

        jasmine.Ajax.requests.mostRecent().responseError();

        request
            .then(function() {
                fail('The request should have rejected.');
            })
            .catch(function() {
                done();
            });
    });

    it('Should resolve with the response if successful', function(done) {
        var request = ajax.xhr('GET');

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '200',
            responseText: 'some text'
        });

        request
            .then(function(response) {
                expect(response).toEqual('some text');
                done();
            })
            .catch(function() {
                fail("No error should have been thrown.");
            });
    });
});

describe('ajax.get', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should use a GET request', function() {
        ajax.get();

        expect(jasmine.Ajax.requests.mostRecent().method).toEqual('GET');
    });

    it('Should add parameters to the URL', function() {
        ajax.get('/some/url', {param: "string"});

        expect(jasmine.Ajax.requests.mostRecent().url).toEqual('/some/url?param=string');
    });

    it('Should handle urls with parameters', function() {
        ajax.get('/some/url?something=important', {param: "string"});

        expect(jasmine.Ajax.requests.mostRecent().url).toEqual('/some/url?something=important&param=string');
    });

    //Further tests would simply duplicate those used in ajax.xhr
});

describe('ajax.post', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should use a POST request', function() {
        ajax.post();

        expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST');
    });

    it('Should set Content-Type', function() {
        ajax.post();

        expect(jasmine.Ajax.requests.mostRecent().contentType()).toEqual('application/x-www-form-urlencoded');
    });

    //Further tests would simply duplicate those used in ajax.xhr
});

describe('ajax.getJSON', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should use a GET request', function() {
        ajax.getJSON();

        expect(jasmine.Ajax.requests.mostRecent().method).toEqual('GET');
    });

    it('Should parse the response as JSON.', function(done) {
        ajax.getJSON()
            .then(function(response) {
                expect(response).toEqual({test: 'yay!'});
                done();
            })
            .catch(function() {
                fail('Should not have thrown an error.');
            });

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '200',
            responseText: '{"test":"yay!"}',
        });
    });

    //Further tests would simply duplicate those used in ajax.xhr
});

describe('ajax.postJSON', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should use a POST request', function() {
        ajax.postJSON();

        expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST');
    });

    it('Should parse the response as JSON.', function(done) {
        ajax.postJSON()
            .then(function(response) {
                expect(response).toEqual({test: 'yay!'});
                done();
            })
            .catch(function() {
                fail('Should not have thrown an error.');
            });

        jasmine.Ajax.requests.mostRecent().respondWith({
            status: '200',
            responseText: '{"test":"yay!"}',
        });
    });

    //Further tests would simply duplicate those used in ajax.xhr
});
