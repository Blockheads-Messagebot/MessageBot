"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var chai_1 = require("chai");
var template_1 = require("./template");
describe('buildTemplate', function () {
    describe('Template', function () {
        it('Can be passed as a string to select the template', function () {
            var container = document.createElement('div');
            var template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';
            template.id = 'template_' + Math.random().toString().replace('.', '');
            document.body.appendChild(template);
            template_1.buildTemplate("#" + template.id, container);
            template.remove();
            chai_1.expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
        it('Can be passed a template element', function () {
            var container = document.createElement('div');
            var template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';
            template_1.buildTemplate(template, container);
            chai_1.expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
    });
    describe('Target', function () {
        it('Can be passed as a string to select the target', function () {
            var container = document.createElement('div');
            var template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';
            container.id = 'template_' + Math.random().toString().replace('.', '');
            document.body.appendChild(container);
            template_1.buildTemplate(template, "#" + container.id);
            container.remove();
            chai_1.expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
        it('Can be passed as an element to append the template to as a child', function () {
            var container = document.createElement('div');
            var template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';
            template_1.buildTemplate(template, container);
            chai_1.expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
    });
    describe('Rules', function () {
        describe('selector', function () {
            it('Should be applied within the template', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                var random = 'class_' + Math.random().toString().replace('.', '');
                template.innerHTML = "<div class=\"" + random + "\">Hi</div>";
                var herring = document.createElement('div');
                herring.classList.add(random);
                document.body.appendChild(herring);
                template_1.buildTemplate(template, container, [
                    { selector: "." + random, text: 'OK' }
                ]);
                herring.remove();
                chai_1.expect(container.textContent).to.equal('OK');
            });
        });
        describe('multiple', function () {
            it('Should be false by default', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div> <div>Hello</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', text: 'Test' }
                ]);
                chai_1.expect(container.textContent).to.equal('Test Hello');
            });
            it('Should result in all matched elements being updated if set to true', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div> <div>Hello</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', text: 'Test', multiple: true }
                ]);
                chai_1.expect(container.textContent).to.equal('Test Test');
            });
        });
        describe('text', function () {
            it('Should set the textContent of matched elements', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', text: '<b>Text</b>' }
                ]);
                chai_1.expect(container.textContent).to.equal('<b>Text</b>');
            });
            it('Should take precedence if both text and html are set', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', text: '<b>Text</b>', html: '<b>Text</b>' }
                ]);
                chai_1.expect(container.textContent).to.equal('<b>Text</b>');
            });
        });
        describe('html', function () {
            it('Should set the innerHTML of the element', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', html: '<b>Text</b>' }
                ]);
                chai_1.expect(container.innerHTML).to.equal('<div><b>Text</b></div>');
            });
        });
        describe('other properties', function () {
            it('Should set other properties as attributes', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';
                template_1.buildTemplate(template, container, [
                    { selector: 'div', 'data-test': 'Hello' }
                ]);
                var div = container.querySelector('div');
                chai_1.expect(div.dataset['test']).to.equal('Hello');
            });
        });
    });
    describe('Special cases', function () {
        describe('Textarea Elements', function () {
            it('Should set the value as the textContent of the element', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<textarea>Content</textarea>';
                template_1.buildTemplate(template, container, [
                    { selector: 'textarea', value: '<b>Text</b>' }
                ]);
                chai_1.expect(container.innerHTML).to.equal('<textarea>&lt;b&gt;Text&lt;/b&gt;</textarea>');
            });
            it('Should override any text values', function () {
                var container = document.createElement('div');
                var template = document.createElement('template');
                template.innerHTML = '<textarea>Content</textarea>';
                template_1.buildTemplate(template, container, [
                    { selector: 'textarea', value: 'Text', text: 'Hello!' }
                ]);
                chai_1.expect(container.innerHTML).to.equal('<textarea>Text</textarea>');
            });
        });
    });
});
