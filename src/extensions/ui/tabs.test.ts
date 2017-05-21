import { TabManager } from './tabs';

import { expect } from 'chai';
import 'mocha';

describe('TabManager', function() {
    let navRoot: HTMLDivElement;
    let contentRoot: HTMLDivElement;
    let tabs: TabManager;

    beforeEach(function() {
        navRoot = document.createElement('div');
        contentRoot = document.createElement('div');
        tabs = new TabManager(navRoot, contentRoot);
    });

    describe('addTab', function() {
        it('Should add a span element to the navigation', function() {
            tabs.addTab('Text');
            expect(navRoot.children.length).to.equal(1, 'A single nav element should be added.');
        });

        it('Should give the navigation span a .nav-item class', function() {
            tabs.addTab('Text');
            expect(navRoot.children[0].classList.contains('nav-item')).to.be.true;
        });

        it('Should use the passed text as the navigation item text', function() {
            tabs.addTab('Text');
            expect(navRoot.children[0].textContent).to.equal('Text');
        });

        it('Should add a content div', function() {
            tabs.addTab('Text');
            expect(contentRoot.children.length).to.equal(1, 'It should add exactly one div');
        });

        it('Should return the content div', function() {
            let tab = tabs.addTab('Text');
            expect(contentRoot.children[0]).to.equal(tab);
        });

        it('Should add the tab nav to the specified group', function() {
            tabs.addTabGroup('Group', 'group');
            tabs.addTab('Text', 'group');

            try {
                expect(navRoot.children[0].children[1].textContent).to.equal('Text');
            } catch(e) {
                expect(true).to.be.false('The nav should have been added as the second child of the details tab group');
            }
        });

        it('Should throw if the tab group does not exist', function() {
            expect(tabs.addTab.bind(tabs, 'Text', 'group')).to.throw;
        });
    });

    describe('removeTab', function() {
        let tab: HTMLDivElement;
        beforeEach(function() {
            tab = tabs.addTab('Text');
        });

        it('Should remove the navigation span', function() {
            tabs.removeTab(tab);
            expect(navRoot.children.length).to.equal(0);
        });

        it('Should remove the content div', function() {
            tabs.removeTab(tab);
            expect(contentRoot.children.length).to.equal(0);
        });

        it('Should return true if a div was removed', function() {
            let result = tabs.removeTab(tab);
            expect(result).to.be.true;
        });

        it('Should not remove a tab from the content root if it does not exist', function() {
            tabs.removeTab(document.createElement('div'));
            expect(contentRoot.children.length).to.equal(1);
        });

        it('Should not remove a tab from the navigation root if it does not exist', function() {
            tabs.removeTab(document.createElement('div'));
            expect(navRoot.children.length).to.equal(1);
        });

        it('Should return false if the tab was not removed', function() {
            let result = tabs.removeTab(document.createElement('div'));
            expect(result).to.be.false;
        });
    });

    describe('addTabGroup', function() {
        it('Should throw if the group already exists', function() {
            tabs.addTabGroup('Text', 'group');
            try {
                tabs.addTabGroup('Text', 'group');
                expect(false).to.be.true('The function should have thrown');
            } catch (err) {
                // Good.
            }
        });

        it('Should create a details element', function() {
            tabs.addTabGroup('Text', 'group');
            expect(navRoot.children[0].nodeName).to.equal('DETAILS');
        });

        it('Should add the .nav-item class to the details element', function() {
            tabs.addTabGroup('Text', 'group');
            expect(navRoot.children[0].classList.contains('nav-item')).to.be.true;
        });

        it('Should set the summary element\'s text to the provided text', function() {
            tabs.addTabGroup('Text', 'group');
            expect(navRoot.children[0].children[0].textContent).to.equal('Text');
        });

        it('Should properly add groups to parents', function() {
            tabs.addTabGroup('Parent', 'parent');
            tabs.addTabGroup('Group', 'group', 'parent');

            expect(navRoot.querySelector('details > details')).not.to.be.null;
        });

        it('Should throw if the parent group does not exist', function() {
            try {
                tabs.addTabGroup('Group', 'group', 'missingParent');
                expect(false).to.be.true('The function should have thrown.');
            } catch (e) {
                // Good.
            }
        });
    });

    describe('removeTabGroup', function() {
        let outer: HTMLElement;

        beforeEach(function() {
            tabs.addTabGroup('Group', 'group');
            tabs.addTab('Text1', 'group');
            tabs.addTab('Text2', 'group');
            outer = tabs.addTab('Text3');
        });

        it('Should return true when removing the group', function() {
            expect(tabs.removeTabGroup('group')).to.be.true;
        });

        it('Should return false if the group does not exist', function() {
            expect(tabs.removeTabGroup('nope')).to.be.false;
        });

        it('Should remove only tabs in the group', function() {
            tabs.removeTabGroup('group');
            expect(contentRoot.children.length).to.equal(1);
            expect(contentRoot.children[0]).to.equal(outer);
        });

        it('Should remove the details element', function() {
            tabs.removeTabGroup('group');
            expect(navRoot.querySelector('details')).to.be.null;
        });
    });
});
