/*jshint
    jasmine: true,
    unused: true
*/

/*globals
    CreateBHFansAPI
*/

// autoloadExtension(id, shouldAutoload)
// removeExtension(id)
// reportError(err)

describe('bhfansapi.getStore', function() {
    var api;

    beforeEach(function() {
        jasmine.Ajax.install();
        api = CreateBHFansAPI(window.ajax, window.storage, window);
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

describe('bhfansapi.getExtensionNames', function() {
    var api;

    beforeEach(function() {
        jasmine.Ajax.install();
        api = CreateBHFansAPI(window.ajax, window.storage, window);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should return a promise', function() {
        expect(api.getExtensionNames([])).toEqual(jasmine.any(Promise));
    });

    it('Should send the extension names', function() {
        api.getExtensionNames(['some_ext', 'some_other_ext']);

        expect(jasmine.Ajax.requests.mostRecent().params).toContain('some_ext');
        expect(jasmine.Ajax.requests.mostRecent().params).toContain('some_other_ext');
    });
});

describe('bhfansapi.listExtensions', function() {
    //Not tested, too tightly coupled. Needs refactoring.
});

describe('bhfansapi.startExtension', function() {
    //Directly loads the extension from BHFans, not sure how to test this... It works!
});

describe('bhfansapi.removeExtension', function() {
    var api;
    var container;
    var some_extension;

    beforeEach(function() {
        container = {};
        some_extension = {uninstall: function() {}};
        container.some_extension = some_extension;

        jasmine.Ajax.install();
        api = CreateBHFansAPI(window.ajax, window.storage, container);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should call the uninstall function', function() {
        spyOn(some_extension, 'uninstall');
        api.removeExtension('some_extension');

        expect(some_extension.uninstall).toHaveBeenCalled();
    });

    it('Should set the variable to undefined', function() {
        api.removeExtension('some_extension');

        expect(container.some_extension).toBe(undefined);
    });
});

describe('bhfansapi.extensionInstalled', function() {
    var api;
    var container;
    var some_extension;

    beforeEach(function() {
        container = {};
        some_extension = {uninstall: function() {}};
        container.some_extension = some_extension;

        jasmine.Ajax.install();
        api = CreateBHFansAPI(window.ajax, {set: function(){}}, container);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('Should return true if the variable exists', function() {
        expect(api.extensionInstalled('some_extension')).toBeTruthy();
    });

    it('Should return true if the extension has been set to autolaunch.', function() {
        api.autoloadExtension('some_other_extension', true);
        expect(api.extensionInstalled('some_other_extension')).toBeTruthy();
    });

});
