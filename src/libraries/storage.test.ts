import { Storage } from './storage';

import { expect } from 'chai';
import 'mocha';

const NAMESPACE = '__testing__';

describe('Storage', function() {
    let storage: Storage;
    beforeEach(function() {
        localStorage.clear();
        storage = new Storage(NAMESPACE);
    });

    describe('getString', function () {
        beforeEach(function () {
            localStorage.setItem(`test${NAMESPACE}`, 'local');
            localStorage.setItem('test', 'globalTest');
        });

        it('Uses the provided namespace.', function () {
            expect(storage.getString('test', '')).to.equal(localStorage.getItem(`test${NAMESPACE}`));
        });

        it('Returns the fallback if the item does not exist.', function () {
            expect(storage.getString('nOP', 'fallback')).to.equal('fallback');
        });

        it('Can access globals', function () {
            expect(storage.getString('test', '', false)).to.equal(localStorage.getItem('test'));
        });
    });

    describe('getObject', function () {
        let storedLocal = { test: 123, abc: "text", a: ['a', 'r', 'r'], b: { c: 321 } };
        let storedGlobal = { test: 343, abc: "aaa", a: ['b', 'd', 'n'], b: { c: 56 } };

        beforeEach(function () {
            localStorage.setItem(`object${NAMESPACE}`, JSON.stringify(storedLocal));
            localStorage.setItem('object', JSON.stringify(storedGlobal));
        });

        it('Uses the provided namespace.', function () {
            expect(storage.getObject('object', {})).to.deep.equal(storedLocal);
        });

        it('Returns the fallback if the item does not exist.', function () {
            expect(storage.getObject('object_noOP', 'fallback')).to.equal('fallback');
        });

        it('Can access globals', function () {
            expect(storage.getObject('object', undefined, false)).to.deep.equal(storedGlobal);
        });
    });

    describe('set', function () {
        it('Uses the provided namespace.', function () {
            storage.set('str', 'value');
            expect(localStorage.getItem(`str${NAMESPACE}`)).to.equal('value');
        });

        it('Uses globals.', function () {
            storage.set('str', 'value', false);
            expect(localStorage.getItem('str')).to.equal('value');
        });

        it('Can set objects', function () {
            storage.set('obj', { some: 'object' });
            expect(localStorage.getItem(`obj${NAMESPACE}`)).to.equal('{"some":"object"}');
        });

        it('Can set arrays', function () {
            storage.set('obj', [1, 2, 3]);
            expect(localStorage.getItem(`obj${NAMESPACE}`)).to.equal('[1,2,3]');
        });
    });

    describe('clearNamespace', function () {
        beforeEach(function () {
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

        it('Removes namespaced items.', function () {
            [
                'ns__123',
                'ns__656',
                'ns__test',
            ].forEach(item => {
                expect(localStorage.getItem(item)).to.be.null;
            });
        });

        it('Does not remove non-matching items.', function () {
            [
                'something',
                'str__abc',
                'obj__adf',
            ].forEach(item => {
                expect(localStorage.getItem(item)).not.to.be.null;
            });
        });
    });
});




