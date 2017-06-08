import 'mocha';
import { expect } from 'chai';

import { buildTemplate } from './template';

describe('buildTemplate', function() {
    describe('Template', function() {
        it('Can be passed as a string to select the template', function() {
            let container = document.createElement('div');
            let template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';

            template.id = 'template_' + Math.random().toString().replace('.', '');
            document.body.appendChild(template);

            buildTemplate(`#${template.id}`, container);
            template.remove();

            expect(container.innerHTML).to.equal('<div>Hi</div>');
        });

        it('Can be passed a template element', function() {
            let container = document.createElement('div');
            let template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';

            buildTemplate(template, container);

            expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
    });

    describe('Target', function() {
        it('Can be passed as a string to select the target', function() {
            let container = document.createElement('div');
            let template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';

            container.id = 'template_' + Math.random().toString().replace('.', '');
            document.body.appendChild(container);

            buildTemplate(template, `#${container.id}`);
            container.remove();

            expect(container.innerHTML).to.equal('<div>Hi</div>');
        });

        it('Can be passed as an element to append the template to as a child', function() {
            let container = document.createElement('div');
            let template = document.createElement('template');
            template.innerHTML = '<div>Hi</div>';

            buildTemplate(template, container);

            expect(container.innerHTML).to.equal('<div>Hi</div>');
        });
    });

    describe('Rules', function() {
        describe('selector', function() {
            it('Should be applied within the template', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                let random = 'class_' + Math.random().toString().replace('.', '');
                template.innerHTML = `<div class="${random}">Hi</div>`;

                let herring = document.createElement('div');
                herring.classList.add(random);
                document.body.appendChild(herring);

                buildTemplate(template, container, [
                    { selector: `.${random}`, text: 'OK'}
                ]);
                herring.remove();

                expect(container.textContent).to.equal('OK');
            });
        });

        describe('multiple', function() {
            it('Should be false by default', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div> <div>Hello</div>';

                buildTemplate(template, container, [
                    { selector: 'div', text: 'Test' }
                ]);

                expect(container.textContent).to.equal('Test Hello');
            });

            it('Should result in all matched elements being updated if set to true', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div> <div>Hello</div>';

                buildTemplate(template, container, [
                    { selector: 'div', text: 'Test', multiple: true }
                ]);

                expect(container.textContent).to.equal('Test Test');
            });
        });

        describe('text', function() {
            it('Should set the textContent of matched elements', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';

                buildTemplate(template, container, [
                    { selector: 'div', text: '<b>Text</b>' }
                ]);

                expect(container.textContent).to.equal('<b>Text</b>');
            });

            it('Should take precedence if both text and html are set', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';

                buildTemplate(template, container, [
                    { selector: 'div', text: '<b>Text</b>', html: '<b>Text</b>' }
                ]);

                expect(container.textContent).to.equal('<b>Text</b>');
            });
        });

        describe('html', function() {
            it('Should set the innerHTML of the element', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';

                buildTemplate(template, container, [
                    { selector: 'div', html: '<b>Text</b>' }
                ]);

                expect(container.innerHTML).to.equal('<div><b>Text</b></div>');
            });
        });

        describe('other properties', function() {
            it('Should set other properties as attributes', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<div>Hi</div>';

                buildTemplate(template, container, [
                    { selector: 'div', 'data-test': 'Hello' }
                ]);

                let div = container.querySelector('div') as HTMLElement;

                expect(div.dataset['test']).to.equal('Hello');
            });
        });
    });

    describe('Special cases', function() {
        describe('Textarea Elements', function() {
            it('Should set the value as the textContent of the element', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<textarea>Content</textarea>';

                buildTemplate(template, container, [
                    { selector: 'textarea', value: '<b>Text</b>' }
                ]);

                expect(container.innerHTML).to.equal('<textarea>&lt;b&gt;Text&lt;/b&gt;</textarea>');
            });

            it('Should override any text values', function() {
                let container = document.createElement('div');
                let template = document.createElement('template');
                template.innerHTML = '<textarea>Content</textarea>';

                buildTemplate(template, container, [
                    { selector: 'textarea', value: 'Text', text: 'Hello!' }
                ]);

                expect(container.innerHTML).to.equal('<textarea>Text</textarea>');
            });
        });
    });
});
