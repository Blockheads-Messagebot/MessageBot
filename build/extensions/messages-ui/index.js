"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var fs = require("fs");
bot_1.MessageBot.registerExtension('messages-ui', function (ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI has been loaded.');
    }
    var ui = ex.bot.getExports('ui');
    ui.addTabGroup('Messages', 'messages');
    var tabs = [
        new JoinTab(ex, ui),
        new LeaveTab(ex, ui),
        new TriggerTab(ex, ui),
        new AnnouncementTab(ex, ui),
    ];
    try {
        for (var tabs_1 = __values(tabs), tabs_1_1 = tabs_1.next(); !tabs_1_1.done; tabs_1_1 = tabs_1.next()) {
            var tab = tabs_1_1.value;
            tab.setup();
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (tabs_1_1 && !tabs_1_1.done && (_a = tabs_1.return)) _a.call(tabs_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    ex.uninstall = function () {
        tabs.forEach(function (tab) { return tab.remove(); });
    };
    var e_1, _a;
});
var MessagesTab = (function () {
    function MessagesTab(_a) {
        var name = _a.name, ui = _a.ui, ex = _a.ex;
        var _this = this;
        this.setup = function () {
            _this.insertHTML();
            _this.template = _this.tab.querySelector('template');
            _this.root = _this.tab.querySelector('.messages-container');
            // Auto save messages
            _this.tab.addEventListener('input', function () { return _this.save(); });
            // Create a new message
            var button = _this.tab.querySelector('.button.is-primary');
            button.addEventListener('click', function () {
                _this.addMessage();
            });
            // Deleting messages
            _this.tab.addEventListener('click', function (event) {
                var target = event.target;
                if (target.tagName == 'A' && target.textContent == 'Delete') {
                    event.preventDefault();
                    _this.ui.alert('Really delete this message?', [{ text: 'Delete', style: 'is-danger' }, { text: 'Cancel' }], function (result) {
                        if (result != 'Delete')
                            return;
                        var parent = target;
                        while (!parent.classList.contains('column')) {
                            parent = parent.parentElement;
                        }
                        parent.remove();
                        _this.save();
                    });
                }
            });
            _this.ex.world.storage.getObject(_this.getStorageID(), []).forEach(function (message) {
                _this.addMessage(message);
            });
        };
        this.remove = function () {
            _this.ui.removeTab(_this.tab);
        };
        this.save = function () {
            _this.ex.world.storage.set(_this.getStorageID(), _this.getMessages());
        };
        this.getMessages = function () {
            var messages = [];
            Array.from(_this.root.children).forEach(function (element) {
                var data = {};
                Array.from(element.querySelectorAll('[data-target]')).forEach(function (input) {
                    var name = input.dataset['target'];
                    if (!name)
                        return;
                    switch (input.getAttribute('type')) {
                        case 'number':
                            data[name] = +input.value;
                            break;
                        default:
                            data[name] = input.value;
                    }
                });
                messages.push(data);
            });
            return messages;
        };
        this.ui = ui;
        this.ex = ex;
        this.tab = ui.addTab(name, 'messages');
    }
    return MessagesTab;
}());
var JoinTab = (function (_super) {
    __extends(JoinTab, _super);
    function JoinTab(ex, ui) {
        var _this = _super.call(this, { name: 'Join', ui: ui, ex: ex }) || this;
        _this.insertHTML = function () {
            _this.tab.innerHTML = fs.readFileSync(__dirname + '/join.html', 'utf8');
        };
        _this.getStorageID = function () {
            return 'joinArr';
        };
        _this.addMessage = function (msg) {
            if (msg === void 0) { msg = {}; }
            _this.ui.buildTemplate(_this.template, _this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' },
            ]);
        };
        return _this;
    }
    return JoinTab;
}(MessagesTab));
var LeaveTab = (function (_super) {
    __extends(LeaveTab, _super);
    function LeaveTab(ex, ui) {
        var _this = _super.call(this, { name: 'Leave', ui: ui, ex: ex }) || this;
        _this.insertHTML = function () {
            _this.tab.innerHTML = fs.readFileSync(__dirname + '/leave.html', 'utf8');
        };
        _this.getStorageID = function () {
            return 'leaveArr';
        };
        _this.addMessage = function (msg) {
            if (msg === void 0) { msg = {}; }
            _this.ui.buildTemplate(_this.template, _this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
            ]);
        };
        return _this;
    }
    return LeaveTab;
}(MessagesTab));
var TriggerTab = (function (_super) {
    __extends(TriggerTab, _super);
    function TriggerTab(ex, ui) {
        var _this = _super.call(this, { name: 'Trigger', ui: ui, ex: ex }) || this;
        _this.insertHTML = function () {
            _this.tab.innerHTML = fs.readFileSync(__dirname + '/trigger.html', 'utf8');
        };
        _this.getStorageID = function () {
            return 'triggerArr';
        };
        _this.addMessage = function (msg) {
            if (msg === void 0) { msg = {}; }
            _this.ui.buildTemplate(_this.template, _this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=trigger]', value: msg.trigger || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
            ]);
        };
        return _this;
    }
    return TriggerTab;
}(MessagesTab));
var AnnouncementTab = (function (_super) {
    __extends(AnnouncementTab, _super);
    function AnnouncementTab(ex, ui) {
        var _this = _super.call(this, { name: 'Announcements', ui: ui, ex: ex }) || this;
        _this.insertHTML = function () {
            _this.tab.innerHTML = fs.readFileSync(__dirname + '/announcements.html', 'utf8');
        };
        _this.getStorageID = function () {
            return 'announcementArr';
        };
        _this.addMessage = function (msg) {
            if (msg === void 0) { msg = {}; }
            _this.ui.buildTemplate(_this.template, _this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
            ]);
        };
        return _this;
    }
    return AnnouncementTab;
}(MessagesTab));
