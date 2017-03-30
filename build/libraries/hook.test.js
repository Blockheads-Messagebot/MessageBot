"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hook_1 = require("./hook");
const chai_1 = require("chai");
require("mocha");
describe('Hook', function () {
    let hook;
    beforeEach(function () {
        hook = new hook_1.Hook();
    });
    describe('#listen', function () {
        // Calling this method doesn't change anything visible to the end user.
        // This method is fully tested through the other methods.
    });
    describe('#on', function () {
        it('Should be an alias for listen', function () {
            chai_1.expect(hook.on).to.equal(hook.listen);
        });
    });
    describe('#remove', function () {
        it('Should remove the listener', function () {
            let called = false;
            let listener = () => called = true;
            hook.on('test', listener);
            hook.remove('test', listener);
            hook.fire('test');
            chai_1.expect(called).to.be.false;
        });
    });
    describe('#check', function () {
        it('Should call all listeners', function () {
            let calls = 0;
            let l1 = () => calls++;
            let l2 = () => calls++;
            let l3 = () => calls++;
            hook.on('test', l1);
            hook.on('test', l2);
            hook.on('test', l3);
            hook.check('test');
            chai_1.expect(calls).to.equal(3, 'all listeners should have been called.');
        });
        it('Should call all listeners even if one throws', function () {
            let calls = 0;
            let l1 = () => calls++;
            let l2 = () => {
                calls++;
                throw new Error('Hidden');
            };
            let l3 = () => calls++;
            hook.on('test', l1);
            hook.on('test', l2);
            hook.on('test', l3);
            hook.check('test');
            chai_1.expect(calls).to.equal(3, 'all listeners should have been called.');
        });
    });
    describe('#fire', function () {
        it('Should be an alias of check', function () {
            chai_1.expect(hook.fire).to.equal(hook.check);
        });
    });
});
