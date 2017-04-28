"use strict";
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
var simpleevent_1 = require("../../libraries/simpleevent");
/**
 * Class which manages a set of tabs, exported by the UI extension.
 * Extensions may use this class to manage tabs internally.
 */
var TabManager = (function () {
    /**
     * Creates a new TabManager instance.
     *
     * @param navigationRoot the root element for navigation items
     * @param contentRoot the root element which content should be added to.
     */
    function TabManager(navigationRoot, contentRoot) {
        var _this = this;
        this.tabUID = 0;
        /**
         * Fired whenever a tab is shown
         *
         * @param <TEvent> the tab which was shown
         */
        this.tabShown = new simpleevent_1.SimpleEvent();
        this.navigationRoot = navigationRoot;
        this.contentRoot = contentRoot;
        this.navigationRoot.addEventListener('click', function (event) {
            var tabNav = event.target;
            var tabName = tabNav.dataset.tabName;
            var content = _this.contentRoot.querySelector("[data-tab-name=" + tabName + "]");
            if (!tabName || !content) {
                return;
            }
            try {
                for (var _a = __values(_this.contentRoot.querySelectorAll('.visible')), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var el = _b.value;
                    el.classList.remove('visible');
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            content.classList.add('visible');
            try {
                for (var _d = __values(_this.navigationRoot.querySelectorAll('.is-active')), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var el = _e.value;
                    el.classList.remove('is-active');
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
                }
                finally { if (e_2) throw e_2.error; }
            }
            tabNav.classList.add('is-active');
            _this.tabShown.dispatch(content);
            var e_1, _c, e_2, _f;
        });
    }
    /**
     * Adds a tab to the content root, the children of the returned <div> may be modified however you like.
     *
     * @param text the text which should appear in the menu for the tab
     * @param groupName the tab group to add the tab to, if omitted the tab will be added to the root navigation.
     * @return the div which the tab content should be placed in.
     */
    TabManager.prototype.addTab = function (text, groupName) {
        var tabName = 'tab_' + this.tabUID++;
        var tab = document.createElement('span');
        var content = document.createElement('div');
        tab.textContent = text;
        tab.classList.add('nav-item');
        tab.dataset.tabName = content.dataset.tabName = tabName;
        var navParent;
        if (groupName) {
            navParent = this.navigationRoot.querySelector("[data-tab-group=" + groupName + "]");
            if (!navParent) {
                throw new Error("Tab group " + groupName + " does not exist.");
            }
        }
        else {
            navParent = this.navigationRoot;
        }
        navParent.appendChild(tab);
        this.contentRoot.appendChild(content);
        return content;
    };
    /**
     * Removes a tab from the tab root, if it exists, otherwise has no effect.
     *
     * @param content the tab which should be removed.
     */
    TabManager.prototype.removeTab = function (content) {
        var nav = this.navigationRoot.querySelector(".nav-item[data-tab-name=" + content.dataset.tabName + "]");
        if (nav) {
            nav.remove();
            content.remove();
            return true;
        }
        return false;
    };
    /**
     * Adds a new tab group to the tab content, if it does not already exist. If it exists, this function will throw.
     *
     * @param text the text to display in group dropdown
     * @param groupName the name of the group to create or update
     * @param parent the parent of this group, if not provided the group will be added to the root of the navigation tree.
     */
    TabManager.prototype.addTabGroup = function (text, groupName, parent) {
        if (this.navigationRoot.querySelector("[data-tab-group=\"" + groupName + "\"]")) {
            throw new Error('Group already exists.');
        }
        var group = document.createElement('details');
        var summary = document.createElement('summary');
        summary.textContent = text;
        group.appendChild(summary);
        group.dataset.tabGroup = groupName;
        var parentNav;
        if (parent) {
            parentNav = this.navigationRoot.querySelector("[data-tab-group=\"" + parent + "\"]");
        }
        else {
            parentNav = this.navigationRoot;
        }
        if (parentNav) {
            parentNav.appendChild(group);
        }
        else {
            throw new Error('Parent group does not exist.');
        }
    };
    /**
     * Removes a tab group and all tabs contained within the group.
     *
     * @param groupName the group to remove.
     * @return boolean true if the group existed and was removed, otherwise false.
     */
    TabManager.prototype.removeTabGroup = function (groupName) {
        var group = this.navigationRoot.querySelector("[data-tab-group=\"" + groupName + "\"]");
        if (!group) {
            return false;
        }
        try {
            for (var _a = __values(group.querySelectorAll('span')), _b = _a.next(); !_b.done; _b = _a.next()) {
                var item = _b.value;
                this.contentRoot.querySelector("[data-tab-name=\"" + item.dataset.tabName + "\"]").remove();
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        group.remove();
        return true;
        var e_3, _c;
    };
    return TabManager;
}());
exports.TabManager = TabManager;
