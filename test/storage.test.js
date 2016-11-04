/*jshint
    jasmine: true,
    unused: true
*/

/*globals
    CreateStorage
*/

describe('storage.getString', function() {
    var storage;

    beforeEach(function() {
        storage = CreateStorage('__getString');

        localStorage.setItem('test__getString', 'local');
        localStorage.setItem('test', 'globalTest');
        localStorage.removeItem('noOP__getString');
    });

    it('Uses the provided namespace.', function() {
        expect(storage.getString('test')).toEqual(localStorage.getItem('test__getString'));
    });

    it('Returns the fallback if the item does not exist.', function() {
        expect(storage.getString('nOP', 'fallback')).toEqual('fallback');
    });

    it('Can access globals', function() {
        expect(storage.getString('test', undefined, false)).toEqual('globalTest');
    });
});

describe('storage.getObject', function() {
    var storage;
    var storedLocal = {test: 123, abc: "text", a: ['a', 'r', 'r'], b: {c: 321}};
    var storedGlobal = {test: 343, abc: "aaa", a: ['b', 'd', 'n'], b: {c: 56}};

    beforeEach(function() {
        storage = CreateStorage('__getObject');

        localStorage.setItem('test__getObject', JSON.stringify(storedLocal));
        localStorage.setItem('test', JSON.stringify(storedGlobal));
        localStorage.removeItem('noOP__getObject');
    });

    it('Uses the provided namespace.', function() {
        expect(storage.getObject('test')).toEqual(storedLocal);
    });

    it('Returns the fallback if the item does not exist.', function() {
        expect(storage.getObject('nOP', 'fallback')).toEqual('fallback');
    });

    it('Can access globals', function() {
        expect(storage.getObject('test', undefined, false)).toEqual(storedGlobal);
    });
});

describe('storage.set', function() {
    var storage;

    beforeEach(function() {
        storage = CreateStorage('__set');

        ['str', 'obj'].forEach(item => localStorage.removeItem(item));
        ['str', 'obj'].forEach(item => localStorage.removeItem(`${item}__set`));
    });

    it('Uses the provided namespace.', function() {
        storage.set('str', 'value');
        expect(localStorage.getItem('str__set')).toEqual('value');
    });

    it('Uses globals.', function() {
        storage.set('str', 'value', false);
        expect(localStorage.getItem('str')).toEqual('value');
    });

    it('Can set objects', function() {
        storage.set('obj', {some: 'object'});
        expect(localStorage.getItem('obj__set')).toEqual('{"some":"object"}');
    });

    it('Can set arrays', function() {
        storage.set('obj', [1, 2, 3]);
        expect(localStorage.getItem('obj__set')).toEqual('[1,2,3]');
    });
});

describe('storage.clearNamespace', function() {
    var storage;

    beforeEach(function() {
        storage = CreateStorage('__ns');

        [
            'something',
            'str__abc',
            'obj__adf',
            'ns__123',
            'ns__656',
            'ns__test',
        ].forEach(item => localStorage.setItem(item, 'exists'));

        storage.clearNamespace('ns__');
    });

    it('Removes namespaced items.', function() {
        [
            'ns__123',
            'ns__656',
            'ns__test',
        ].forEach(item => {
            expect(localStorage.getItem(item)).toBe(null);
        });
    });

    it('Does not remove non-matching items.', function() {
        [
            'something',
            'str__abc',
            'obj__adf',
        ].forEach(item => {
            expect(localStorage.getItem(item)).not.toBe(null);
        });
    });
});
