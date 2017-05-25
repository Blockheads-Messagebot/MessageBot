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
    ex.uninstall = function () {
        tabs.forEach(function (tab) { return tab.remove(); });
    };
});
var MessagesTab = (function () {
    function MessagesTab(_a) {
        var name = _a.name, ui = _a.ui, ex = _a.ex;
        var _this = this;
        this.ui = ui;
        this.ex = ex;
        this.tab = ui.addTab(name, 'messages');
        this.insertHTML();
        this.template = this.tab.querySelector('template');
        this.root = this.tab.querySelector('.messages-container');
        // Auto save messages
        this.tab.addEventListener('input', function () { return _this.save(); });
        // Create a new message
        var button = this.tab.querySelector('.button.is-primary');
        button.addEventListener('click', function () {
            _this.addMessage();
        });
        // Deleting messages
        this.tab.addEventListener('click', function (event) {
            var target = event.target;
            if (target.tagName == 'A' && target.textContent == 'Delete') {
                event.preventDefault();
                ui.alert('Really delete this message?', [{ text: 'Delete', style: 'is-danger' }, { text: 'Cancel' }], function (result) {
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
        this.ex.world.storage.getObject(this.getStorageID(), []).forEach(function (message) {
            _this.addMessage(message);
        });
    }
    MessagesTab.prototype.remove = function () {
        this.ui.removeTab(this.tab);
    };
    MessagesTab.prototype.save = function () {
        this.ex.world.storage.set(this.getStorageID(), this.getMessages());
    };
    MessagesTab.prototype.getMessages = function () {
        var messages = [];
        Array.from(this.root.children).forEach(function (element) {
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
    return MessagesTab;
}());
var JoinTab = (function (_super) {
    __extends(JoinTab, _super);
    function JoinTab(ex, ui) {
        return _super.call(this, { name: 'Join', ui: ui, ex: ex }) || this;
    }
    JoinTab.prototype.insertHTML = function () {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/join.html', 'utf8');
    };
    JoinTab.prototype.getStorageID = function () {
        return 'joinArr';
    };
    JoinTab.prototype.addMessage = function (msg) {
        if (msg === void 0) { msg = {}; }
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' },
        ]);
    };
    return JoinTab;
}(MessagesTab));
var LeaveTab = (function (_super) {
    __extends(LeaveTab, _super);
    function LeaveTab(ex, ui) {
        return _super.call(this, { name: 'Leave', ui: ui, ex: ex }) || this;
    }
    LeaveTab.prototype.insertHTML = function () {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/leave.html', 'utf8');
    };
    LeaveTab.prototype.getStorageID = function () {
        return 'leaveArr';
    };
    LeaveTab.prototype.addMessage = function (msg) {
        if (msg === void 0) { msg = {}; }
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ]);
    };
    return LeaveTab;
}(MessagesTab));
var TriggerTab = (function (_super) {
    __extends(TriggerTab, _super);
    function TriggerTab(ex, ui) {
        return _super.call(this, { name: 'Trigger', ui: ui, ex: ex }) || this;
    }
    TriggerTab.prototype.insertHTML = function () {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/trigger.html', 'utf8');
    };
    TriggerTab.prototype.getStorageID = function () {
        return 'triggerArr';
    };
    TriggerTab.prototype.addMessage = function (msg) {
        if (msg === void 0) { msg = {}; }
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=trigger]', value: msg.trigger || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ]);
    };
    return TriggerTab;
}(MessagesTab));
var AnnouncementTab = (function (_super) {
    __extends(AnnouncementTab, _super);
    function AnnouncementTab(ex, ui) {
        return _super.call(this, { name: 'Announcements', ui: ui, ex: ex }) || this;
    }
    AnnouncementTab.prototype.insertHTML = function () {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/announcements.html', 'utf8');
    };
    AnnouncementTab.prototype.getStorageID = function () {
        return 'announcementArr';
    };
    AnnouncementTab.prototype.addMessage = function (msg) {
        if (msg === void 0) { msg = {}; }
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
        ]);
    };
    return AnnouncementTab;
}(MessagesTab));
