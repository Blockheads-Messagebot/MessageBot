"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Holds the current alert and queue of further alerts.
 */
var modal = document.querySelector('#alert');
var modalBody = modal.querySelector('.modal-card-body');
var modalFooter = modal.querySelector('.modal-card-foot');
var instance = {
    active: false,
    queue: [],
};
modalFooter.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || target.tagName != 'A') {
        return;
    }
    if (instance.current && instance.current.callback) {
        // Text is a special property of anchor elements that always contains the text, textContent can be null.
        try {
            instance.current.callback(target.text);
        }
        catch (e) {
            console.error("Error running button handler: ", e);
        }
    }
    modal.classList.remove('is-active');
    modalFooter.innerHTML = '';
    instance.active = false;
    // Are more alerts waiting to be shown?
    var next = instance.queue.shift();
    if (next) {
        alert(next.html, next.buttons, next.callback);
    }
});
function addButton(button) {
    if (typeof button == 'string') {
        addButton({ text: button });
        return;
    }
    var el = document.createElement('a');
    el.innerHTML = button.text;
    el.classList.add('button');
    if (button.style) {
        el.classList.add(button.style);
    }
    modalFooter.appendChild(el);
}
function alert(html, buttons, callback) {
    if (instance.active) {
        instance.queue.push({ html: html, buttons: buttons, callback: callback });
        return;
    }
    instance.active = true;
    instance.current = { html: html, buttons: buttons, callback: callback };
    modalBody.innerHTML = html;
    if (Array.isArray(buttons)) {
        buttons.forEach(addButton);
    }
    modal.classList.add('is-active');
}
exports.alert = alert;
