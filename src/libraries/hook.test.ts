import {Hook} from './hook';

import {expect} from 'chai';
import 'mocha';

describe('Hook', function() {
    let hook: Hook;

    beforeEach(function() {
        hook = new Hook();
    });

    describe('#listen', function() {
        // Calling this method doesn't change anything visible to the end user.
        // This method is fully tested through the other methods.
    });

    describe('#on', function() {
        it('Should be an alias for listen', function() {
            expect(hook.on).to.equal(hook.listen);
        });
    });

    describe('#remove', function() {
        it('Should remove the listener', function() {
            let called = false;
            let listener = () => called = true;

            hook.on('test', listener);
            hook.remove('test', listener);
            hook.fire('test');

            expect(called).to.be.false;
        });
    });

    describe('#check', function() {
        it('Should call all listeners', function() {
            let calls = 0;
            let l1 = () => calls++;
            let l2 = () => calls++;
            let l3 = () => calls++;

            hook.on('test', l1);
            hook.on('test', l2);
            hook.on('test', l3);

            hook.check('test');

            expect(calls).to.equal(3, 'all listeners should have been called.');
        });

        it('Should call all listeners even if one throws', function() {
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

            expect(calls).to.equal(3, 'all listeners should have been called.');
        });
    });

    describe('#fire', function() {
        it('Should be an alias of check', function() {
            expect(hook.fire).to.equal(hook.check);
        });
    });
});
