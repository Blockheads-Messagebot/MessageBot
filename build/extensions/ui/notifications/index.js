"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @hidden */
function notify(text, displayTime) {
    if (displayTime === void 0) { displayTime = 2; }
    var el = document.createElement('div');
    el.classList.add('bot-notification', 'is-active');
    el.textContent = text;
    document.body.appendChild(el);
    var timeouts = [
        // Fade out after displayTime
        setTimeout(function () {
            el.classList.remove('is-active');
        }, displayTime * 1000),
        // Remove after fade out
        setTimeout(function () {
            el.remove();
        }, displayTime * 1000 + 2100)
    ];
    el.addEventListener('click', function (event) {
        timeouts.forEach(clearTimeout);
        event.target.remove();
    });
}
exports.notify = notify;
var alert_1 = require("./alert");
exports.alert = alert_1.alert;
