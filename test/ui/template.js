//jshint jasmine: true

const buildContentFromTemplate = require('ui/template').buildContentFromTemplate;
const fs = require('fs');

describe('ui.buildContentFromTemplate', function() {
    var container;
    var resultContainer;
    var templateContainer;
    var build;

    beforeEach(function() {
        container = document.createElement('div');
        container.innerHTML = fs.readFileSync(__dirname + '/template.html');
        document.body.appendChild(container);
        resultContainer = container.querySelector('div[data-role="test-ui-template"]');
        templateContainer = container.querySelector('template');
        build = buildContentFromTemplate
           .bind(null, templateContainer, resultContainer);
    });

    afterEach(function() {
        container.remove();
    });

    it('Should set the text of the specified element as text', function() {
        build([
            {selector: 'p', text: '<b>text</b>'}
        ]);

        expect(resultContainer.querySelector('p').textContent).toEqual('<b>text</b>');
    });

    it('Should set the innerHTML of the specified element', function() {
        build([
            {selector: 'p', html: '<b>text</b>'}
        ]);

        expect(resultContainer.querySelector('p').innerHTML).toEqual('<b>text</b>');
    });

    it('Should prefer text over html', function() {
        build([
            {selector: 'p', html: '<b>text</b>', text: '<b>text</b>'}
        ]);

        expect(resultContainer.querySelector('p').textContent).toEqual('<b>text</b>');
    });

    it('Should update a single element by default', function() {
        build([
            {selector: 'li', text: 'text'}
        ]);

        expect(resultContainer.querySelector('li:nth-child(2)').textContent).not.toEqual('text');
    });

    it('Should be able to update multiple elements', function() {
        build([
            {selector: 'li', multiple: true, text: 'text'}
        ]);

        resultContainer.querySelectorAll('li').forEach(el => {
            expect(el.textContent).toEqual('text');
        });
    });

    it('Should be able to remove attributes', function() {
        templateContainer.content.querySelector('p').dataset.something = 'irrelevant';

        build([
            {selector: 'p', remove: ['data-something']}
        ]);

        expect(resultContainer.querySelector('p').dataset.something).not.toEqual('irrelevant');
    });

    it('Should parse rules in order', function() {
        build([
            {selector: 'p', text: 'First'},
            {selector: 'p', text: 'Second'},
            {selector: 'p', text: 'Third'},
        ]);

        expect(resultContainer.querySelector('p').textContent).toEqual('Third');
    });

    it('Should add any other keys as attibutes', function() {
        build([
            {selector: 'p', 'data-something': 'Text!'}
        ]);

        expect(resultContainer.querySelector('p').dataset.something).toEqual('Text!');
    });

    it('Should accept a selector string for the template', function() {
        buildContentFromTemplate('template[data-role="test-ui-template"]', resultContainer, [
            {selector: 'p', text: 'text'}
        ]);

        expect(resultContainer.querySelector('p').textContent).toEqual('text');
    });

    it('Should accept a selector string for the target', function() {
        buildContentFromTemplate(templateContainer, 'div[data-role="test-ui-template"]', [
            {selector: 'p', text: 'text'}
        ]);

        expect(resultContainer.querySelector('p').textContent).toEqual('text');
    });
});
