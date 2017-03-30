import {SimpleEvent} from './simpleevent';

import {expect} from 'chai';
import 'mocha';

describe('SimpleEvent', function() {
    let event: SimpleEvent<string>;

    beforeEach(function() {
        event = new SimpleEvent<string>();
    });

    describe('#subscribe', function() {
        it('Attaches the passed handler', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.subscribe(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });

        it('Does not attach handlers more than once', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.subscribe(caller);
            event.subscribe(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });
    });

    describe('#sub', function() {
        it('Attaches the passed handler', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.sub(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });

        it('Does not attach handlers more than once', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.sub(caller);
            event.sub(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });
    });

    describe('#once', function() {
        it('Attaches the passed handler', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.once(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });

        it('Is only fired for the first call', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.once(caller);
            event.dispatch("hi");
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });

        it('Does not attach handlers more than once', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.once(caller);
            event.once(caller);
            event.dispatch("hi");

            expect(calls).to.equal(1);
        });

        it('Allows reattachment within the function', function() {
            let calls = 0;
            let caller = () => {
                event.once(caller);
                calls++;
            };

            event.once(caller);
            event.dispatch("hi");
            event.dispatch("hi");

            expect(calls).to.equal(2);
        });
    });

    describe('#unsubscribe', function() {
        it('Should remove the handler', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.subscribe(caller);
            event.unsubscribe(caller);
            event.dispatch("hi");

            expect(calls).to.equal(0);
        });

        it('Should not throw if the handler is not attached', function() {
            let caller = () => {};

            event.unsubscribe(caller);
            // An error will pop up if this throws.
        });
    });

    describe('#unsub', function() {
        it('Should remove the handler', function() {
            let calls = 0;
            let caller = () => { calls++; };

            event.subscribe(caller);
            event.unsub(caller);
            event.dispatch("hi");

            expect(calls).to.equal(0);
        });

        it('Should not throw if the handler is not attached', function() {
            let caller = () => {};

            event.unsub(caller);
            // An error will pop up if this throws.
        });
    });

    describe('#dispatch', function() {
        it('Should call all handlers once', function() {
            let calls1 = 0;
            let caller1 = () => { calls1++; };
            let calls2 = 0;
            let caller2 = () => { calls2++; };

            event.sub(caller1);
            event.sub(caller2);
            event.dispatch("Hi");

            expect(calls1).to.equal(1);
            expect(calls2).to.equal(1);
        });

        it('Should call all handlers even if one throws', function() {
            let calls1 = 0;
            let caller1 = () => {
                calls1++;
                throw Error("Fake.");
             };
            let calls2 = 0;
            let caller2 = () => { calls2++; };

            event.sub(caller1);
            event.sub(caller2);
            event.dispatch("Hi");

            expect(calls1).to.equal(1);
            expect(calls2).to.equal(1);
        });
    });

    describe('#has', function() {
        it('Should return true if the callback is a handler', function() {
            let caller = () => {};
            event.sub(caller);

            expect(event.has(caller)).to.be.true;
        });

        it('Should return false if the callback is not a handler', function() {
            let caller = () => {};

            expect(event.has(caller)).to.be.false;
        });
    });
});
