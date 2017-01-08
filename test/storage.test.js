/*jshint
    jasmine: true,
    unused: true
*/

const STORAGE_NAMESPACE = window.worldId = '__testing__';
const storage = require('app/libraries/storage');

describe('storage.getString', function() {
    beforeEach(function() {
        localStorage.clear();
        localStorage.setItem(`test${STORAGE_NAMESPACE}`, 'local');
        localStorage.setItem('test', 'globalTest');
    });

    it('Uses the provided namespace.', function() {
        expect(storage.getString('test')).toEqual(localStorage.getItem(`test${STORAGE_NAMESPACE}`));
    });

    it('Returns the fallback if the item does not exist.', function() {
        expect(storage.getString('nOP', 'fallback')).toEqual('fallback');
    });

    it('Can access globals', function() {
        expect(storage.getString('test', undefined, false)).toEqual(localStorage.getItem('test'));
    });
});

describe('storage.getObject', function() {
    var storedLocal = {test: 123, abc: "text", a: ['a', 'r', 'r'], b: {c: 321}};
    var storedGlobal = {test: 343, abc: "aaa", a: ['b', 'd', 'n'], b: {c: 56}};

    beforeEach(function() {
        localStorage.clear();
        localStorage.setItem(`object${STORAGE_NAMESPACE}`, JSON.stringify(storedLocal));
        localStorage.setItem('object', JSON.stringify(storedGlobal));
    });

    it('Uses the provided namespace.', function() {
        expect(storage.getObject('object')).toEqual(storedLocal);
    });

    it('Returns the fallback if the item does not exist.', function() {
        expect(storage.getObject('object_noOP', 'fallback')).toEqual('fallback');
    });

    it('Can access globals', function() {
        expect(storage.getObject('object', undefined, false)).toEqual(storedGlobal);
    });
});

describe('storage.set', function() {
    beforeEach(function() {
        localStorage.clear();
    });

    it('Uses the provided namespace.', function() {
        storage.set('str', 'value');
        expect(localStorage.getItem(`str${STORAGE_NAMESPACE}`)).toEqual('value');
    });

    it('Uses globals.', function() {
        storage.set('str', 'value', false);
        expect(localStorage.getItem('str')).toEqual('value');
    });

    it('Can set objects', function() {
        storage.set('obj', {some: 'object'});
        expect(localStorage.getItem(`obj${STORAGE_NAMESPACE}`)).toEqual('{"some":"object"}');
    });

    it('Can set arrays', function() {
        storage.set('obj', [1, 2, 3]);
        expect(localStorage.getItem(`obj${STORAGE_NAMESPACE}`)).toEqual('[1,2,3]');
    });
});

describe('storage.clearNamespace', function() {
    beforeEach(function() {
        localStorage.clear();
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
