"use strict";
// Handles the UI of the page, is not available in the node bot.
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
var template_1 = require("./template");
var tabs_1 = require("./tabs");
var fs = require("fs");
bot_1.MessageBot.registerExtension('ui', function (ex) {
    if (ex.isNode) {
        throw new Error('Node bots cannot run this extension.');
    }
    ex.uninstall = function () {
        throw new Error("The UI extension cannot be removed once loaded");
    };
    // Page creation
    document.body.innerHTML = fs.readFileSync(__dirname + '/layout.html', 'utf8');
    // Bulma tries to make this scroll
    var el = document.createElement('style');
    el.textContent = fs.readFileSync(__dirname + '/style.css', 'utf8');
    document.head.appendChild(el);
    // Polyfill for Edge
    if (!('open' in document.createElement('details'))) {
        var style = document.createElement('style');
        style.textContent += "details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: \"\u25B6\"; display: inline-block; font-size: .8em; width: 1.5em; font-family:\"Courier New\"; } details[open] > summary:before { transform: rotate(90deg); }";
        document.head.appendChild(style);
        window.addEventListener('click', function (event) {
            var target = event.target;
            if (target.tagName == 'SUMMARY') {
                var details = target.parentNode;
                if (!details) {
                    return;
                }
                if (details.getAttribute('open')) {
                    details.open = false;
                    details.removeAttribute('open');
                }
                else {
                    details.open = true;
                    details.setAttribute('open', 'open');
                }
            }
        });
    }
    var tabManager = new tabs_1.TabManager(document.querySelector('.nav-slider-container .nav-slider'), document.querySelector('#container'));
    // Exports
    var _a = require('./notifications'), notify = _a.notify, alert = _a.alert;
    var uiExports = {
        toggleMenu: function () {
            document.querySelector('.nav-slider-container .nav-slider').classList.toggle('is-active');
        },
        addTab: function (text, groupName) { return tabManager.addTab(text, groupName); },
        removeTab: function (content) { return tabManager.removeTab(content); },
        addTabGroup: function (text, groupName, parent) {
            return tabManager.addTabGroup(text, groupName, parent);
        },
        removeTabGroup: function (groupName) { return tabManager.removeTabGroup(groupName); },
        tabShown: tabManager.tabShown,
        buildTemplate: template_1.buildTemplate,
        notify: notify,
        alert: alert,
        TabManager: tabs_1.TabManager,
    };
    ex.exports = uiExports;
    try {
        // Showing / hiding the menu
        for (var _b = __values(document.querySelectorAll('.nav-slider-toggle')), _c = _b.next(); !_c.done; _c = _b.next()) {
            var node = _c.value;
            node.addEventListener('click', uiExports.toggleMenu);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var e_1, _d;
});
