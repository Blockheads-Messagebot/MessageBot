"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("./simpleevent");
var chai_1 = require("chai");
require("mocha");
describe('SimpleEvent', function () {
    var event;
    beforeEach(function () {
        event = new simpleevent_1.SimpleEvent();
    });
    describe('#subscribe', function () {
        it('Attaches the passed handler', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.subscribe(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
        it('Does not attach handlers more than once', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.subscribe(caller);
            event.subscribe(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
    });
    describe('#sub', function () {
        it('Attaches the passed handler', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.sub(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
        it('Does not attach handlers more than once', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.sub(caller);
            event.sub(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
    });
    describe('#once', function () {
        it('Attaches the passed handler', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.once(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
        it('Is only fired for the first call', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.once(caller);
            event.dispatch("hi");
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
        it('Does not attach handlers more than once', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.once(caller);
            event.once(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(1);
        });
        it('Allows reattachment within the function', function () {
            var calls = 0;
            var caller = function () {
                event.once(caller);
                calls++;
            };
            event.once(caller);
            event.dispatch("hi");
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(2);
        });
    });
    describe('#unsubscribe', function () {
        it('Should remove the handler', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.subscribe(caller);
            event.unsubscribe(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(0);
        });
        it('Should not throw if the handler is not attached', function () {
            var caller = function () { };
            event.unsubscribe(caller);
            // An error will pop up if this throws.
        });
    });
    describe('#unsub', function () {
        it('Should remove the handler', function () {
            var calls = 0;
            var caller = function () { calls++; };
            event.subscribe(caller);
            event.unsub(caller);
            event.dispatch("hi");
            chai_1.expect(calls).to.equal(0);
        });
        it('Should not throw if the handler is not attached', function () {
            var caller = function () { };
            event.unsub(caller);
            // An error will pop up if this throws.
        });
    });
    describe('#dispatch', function () {
        it('Should call all handlers once', function () {
            var calls1 = 0;
            var caller1 = function () { calls1++; };
            var calls2 = 0;
            var caller2 = function () { calls2++; };
            event.sub(caller1);
            event.sub(caller2);
            event.dispatch("Hi");
            chai_1.expect(calls1).to.equal(1);
            chai_1.expect(calls2).to.equal(1);
        });
        it('Should call all handlers even if one throws', function () {
            var calls1 = 0;
            var caller1 = function () {
                calls1++;
                throw Error("Fake.");
            };
            var calls2 = 0;
            var caller2 = function () { calls2++; };
            event.sub(caller1);
            event.sub(caller2);
            event.dispatch("Hi");
            chai_1.expect(calls1).to.equal(1);
            chai_1.expect(calls2).to.equal(1);
        });
    });
    describe('#has', function () {
        it('Should return true if the callback is a handler', function () {
            var caller = function () { };
            event.sub(caller);
            chai_1.expect(event.has(caller)).to.be.true;
        });
        it('Should return false if the callback is not a handler', function () {
            var caller = function () { };
            chai_1.expect(event.has(caller)).to.be.false;
        });
    });
});
