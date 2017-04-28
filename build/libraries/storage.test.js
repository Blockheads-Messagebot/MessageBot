"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var storage_1 = require("./storage");
var chai_1 = require("chai");
require("mocha");
var NAMESPACE = '__testing__';
describe('storage.getString', function () {
    var storage;
    beforeEach(function () {
        storage = new storage_1.Storage(NAMESPACE);
        localStorage.clear();
        localStorage.setItem("test" + NAMESPACE, 'local');
        localStorage.setItem('test', 'globalTest');
    });
    it('Uses the provided namespace.', function () {
        chai_1.expect(storage.getString('test', '')).to.equal(localStorage.getItem("test" + NAMESPACE));
    });
    it('Returns the fallback if the item does not exist.', function () {
        chai_1.expect(storage.getString('nOP', 'fallback')).to.equal('fallback');
    });
    it('Can access globals', function () {
        chai_1.expect(storage.getString('test', '', false)).to.equal(localStorage.getItem('test'));
    });
});
describe('storage.getObject', function () {
    var storedLocal = { test: 123, abc: "text", a: ['a', 'r', 'r'], b: { c: 321 } };
    var storedGlobal = { test: 343, abc: "aaa", a: ['b', 'd', 'n'], b: { c: 56 } };
    var storage;
    beforeEach(function () {
        storage = new storage_1.Storage(NAMESPACE);
        localStorage.clear();
        localStorage.setItem("object" + NAMESPACE, JSON.stringify(storedLocal));
        localStorage.setItem('object', JSON.stringify(storedGlobal));
    });
    it('Uses the provided namespace.', function () {
        chai_1.expect(storage.getObject('object', {})).to.deep.equal(storedLocal);
    });
    it('Returns the fallback if the item does not exist.', function () {
        chai_1.expect(storage.getObject('object_noOP', 'fallback')).to.equal('fallback');
    });
    it('Can access globals', function () {
        chai_1.expect(storage.getObject('object', undefined, false)).to.deep.equal(storedGlobal);
    });
});
describe('storage.set', function () {
    var storage;
    beforeEach(function () {
        storage = new storage_1.Storage(NAMESPACE);
        localStorage.clear();
    });
    it('Uses the provided namespace.', function () {
        storage.set('str', 'value');
        chai_1.expect(localStorage.getItem("str" + NAMESPACE)).to.equal('value');
    });
    it('Uses globals.', function () {
        storage.set('str', 'value', false);
        chai_1.expect(localStorage.getItem('str')).to.equal('value');
    });
    it('Can set objects', function () {
        storage.set('obj', { some: 'object' });
        chai_1.expect(localStorage.getItem("obj" + NAMESPACE)).to.equal('{"some":"object"}');
    });
    it('Can set arrays', function () {
        storage.set('obj', [1, 2, 3]);
        chai_1.expect(localStorage.getItem("obj" + NAMESPACE)).to.equal('[1,2,3]');
    });
});
describe('storage.clearNamespace', function () {
    beforeEach(function () {
        localStorage.clear();
        [
            'something',
            'str__abc',
            'obj__adf',
            'ns__123',
            'ns__656',
            'ns__test',
        ].forEach(function (item) { return localStorage.setItem(item, 'exists'); });
        var storage = new storage_1.Storage(NAMESPACE);
        storage.clearNamespace('ns__');
    });
    it('Removes namespaced items.', function () {
        [
            'ns__123',
            'ns__656',
            'ns__test',
        ].forEach(function (item) {
            chai_1.expect(localStorage.getItem(item)).to.be.null;
        });
    });
    it('Does not remove non-matching items.', function () {
        [
            'something',
            'str__abc',
            'obj__adf',
        ].forEach(function (item) {
            chai_1.expect(localStorage.getItem(item)).not.to.be.null;
        });
    });
});
