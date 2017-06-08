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
/**
 * Updates an element according to the passed rule.
 *
 * @param el the element to update.
 * @param rule the rule to use to update the element.
 */
function updateElement(el, rule) {
    if (typeof rule.text == 'string') {
        el.textContent = rule.text;
    }
    else if (typeof rule.html == 'string') {
        el.innerHTML = rule.html;
    }
    var blacklist = ['selector', 'text', 'html', 'multiple'];
    if (el instanceof HTMLTextAreaElement && 'value' in rule) {
        blacklist.push('value');
        el.textContent = rule['value'];
    }
    Object.keys(rule)
        .filter(function (key) { return !blacklist.includes(key); })
        .forEach(function (key) { return el.setAttribute(key, rule[key]); });
}
/**
 * Finds elements to update using the passed rule.
 *
 * @param parent the parent to check for matching nodes.
 * @param rule the rule to use.
 */
function handleRule(parent, rule) {
    if (rule.multiple) {
        Array.from(parent.querySelectorAll(rule.selector)).forEach(function (el) {
            updateElement(el, rule);
        });
    }
    else {
        var el = parent.querySelector(rule.selector);
        if (!el) {
            console.warn("Unable to update " + rule.selector + ".", rule);
            return;
        }
        updateElement(el, rule);
    }
}
/**
 * Builds a template into a new node using the provided rules.
 *
 * @hidden
 * @param template the template to clone.
 * @param target the parent node to append the cloned template to.
 * @param rules the rules to apply to the cloned template before appending it to the target.
 */
function buildTemplate(template, target, rules) {
    if (typeof template == 'string') {
        template = document.querySelector(template);
        if (!template)
            throw new Error("Template not found.");
    }
    if (typeof target == 'string') {
        target = document.querySelector(target);
        if (!target)
            throw new Error("Target not found.");
    }
    // Remove this cast when Typedoc updates to Typescript 2.3
    var parent = document.importNode(template.content, true);
    if (Array.isArray(rules)) {
        try {
            for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
                var rule = rules_1_1.value;
                handleRule(parent, rule);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    target.appendChild(parent);
    var e_1, _a;
}
exports.buildTemplate = buildTemplate;
