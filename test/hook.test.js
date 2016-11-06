/*jshint
    jasmine: true,
    unused: true
*/

/*globals
    hook
*/

describe('hook.listen', function() {
    function key(value) { return 'hook.listen.' + value; }

    it('Should add a listening function only once.', function() {
        var c = { listener: function(){} };
        spyOn(c, 'listener');

        hook.listen(key('key'), c.listener);
        hook.listen(key('key'), c.listener);

        hook.check(key('key'));
        expect(c.listener.calls.count()).toEqual(1);
    });
});

describe('hook.check', function() {
    function key(value) { return 'hook.check.' + value; }
    var container = {};

    beforeEach(function() {
        container.func = function() {};
        container.func2 = function() { throw new Error(); };
        container.func3 = function() {};

        spyOn(container, 'func').and.callThrough();
        spyOn(container, 'func2').and.callThrough();
        spyOn(container, 'func3').and.callThrough();

        hook.listen(key('key'), container.func);
        hook.listen(key('key2'), container.func2);
        hook.listen(key('key2'), container.func3);
    });

    afterEach(function() {
        hook.remove(key('key'), container.func);
        hook.remove(key('key2'), container.func2);
        hook.remove(key('key2'), container.func3);
    });

    it('Should call listeners for equal keys', function() {
        hook.check(key('key'));
        expect(container.func).toHaveBeenCalled();
    });

    it('Should call listeners with passed parameters', function() {
        hook.check(key('key'), '123 test');
        expect(container.func).toHaveBeenCalledWith('123 test');
    });

    it('Should call listeners with multiple passed parameters', function() {
        hook.check(key('key'), '123 abc', 456);
        expect(container.func).toHaveBeenCalledWith('123 abc', 456);
    });

    it('Should ignore key case', function() {
        hook.check(key('KEY'));
        expect(container.func).toHaveBeenCalled();
    });

    it('Should call all functions, even with thrown errors', function() {
        hook.check(key('key2'));
        expect(container.func2).toHaveBeenCalled();
        expect(container.func3).toHaveBeenCalled();
    });
});

describe('hook.update', function() {
    function key(value) { return 'hook.update.' + value; }
    var container = {};

    beforeEach(function() {
        container.func = function() {};
        container.func2 = function() { throw new Error(); };
        container.func3 = function() { return 100; };

        spyOn(container, 'func').and.callThrough();
        spyOn(container, 'func2').and.callThrough();
        spyOn(container, 'func3').and.callThrough();

        hook.listen(key('key'), container.func);
        hook.listen(key('key2'), container.func2);
        hook.listen(key('key2'), container.func3);
    });

    it('Should call listeners for equal keys', function() {
        hook.check(key('key'));
        expect(container.func).toHaveBeenCalled();
    });

    it('Should call listeners with passed parameters', function() {
        hook.check(key('key'), '123 test');
        expect(container.func).toHaveBeenCalledWith('123 test');
    });

    it('Should call listeners with multiple passed parameters', function() {
        hook.check(key('key'), '123 abc', 456);
        expect(container.func).toHaveBeenCalledWith('123 abc', 456);
    });

    it('Should ignore key case', function() {
        hook.check(key('KEY'));
        expect(container.func).toHaveBeenCalled();
    });

    it('Should call all functions, even with thrown errors', function() {
        hook.check(key('key2'));
        expect(container.func2).toHaveBeenCalled();
        expect(container.func3).toHaveBeenCalled();
    });

    it('Should return the result if no functions are listening.', function() {
        var expected = 'return me!';
        var actual = hook.update(key('unusedkey'), expected);
        expect(actual).toEqual(expected);
    });

    it('Should return modified data', function() {
        var expected = 100;
        var actual = hook.update(key('key2'), 'not 100');
        expect(actual).toEqual(expected);
    });
});

describe('hook.remove', function() {
    function key(value) { return 'hook.remove.' + value; }

    it('Should remove listeners', function() {
        var c = { listener: function() {}};

        spyOn(c, 'listener');

        hook.listen(key('key'), c.listener);

        hook.remove(key('key'), c.listener);
        hook.check(key('key'));

        expect(c.listener).not.toHaveBeenCalled();
    });
});
