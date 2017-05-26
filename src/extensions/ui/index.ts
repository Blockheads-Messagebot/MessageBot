// Handles the UI of the page, is not available in the node bot.

import {MessageBot} from '../../bot';
import {SimpleEvent} from '../../libraries/simpleevent';

import {buildTemplate, TemplateRule} from './template';
import { TabManager } from "./tabs";

import * as fs from 'fs';

// Note: The documentation for addTab...removeTabGroup is duplicated here and must be kept up to date with the TabManager class.

export interface UIExtensionExports {
    /**
     * Shows or hides the page menu.
     */
    toggleMenu: () => void;
    /**
     * Adds a tab to the page, the children of the returned <div> may be modified however you like.
     *
     * @param text the text which should appear in the menu for the tab
     * @param groupName the tab group to add the tab to, if omitted the tab will be added to the root navigation.
     * @return the div which the tab content should be placed in.
     */
    addTab: (text: string, groupName?: string) => HTMLDivElement;
    /**
     * Removes a tab from the page, if it exists, otherwise has no effect.
     *
     * @param content the tab which should be removed.
     */
    removeTab: (content: HTMLDivElement) => boolean;
    /**
     * Adds a new tab group to the page, if it does not already exist. If it exists, the text of the group will be updated. Supplying a new parent name will not update the parent.
     *
     * @param text the text to display in group dropdown
     * @param groupName the name of the group to create or update
     * @param parent the parent of this group, if not provided the group will be added to the root of the navigation tree.
     */
    addTabGroup: (text: string, groupName: string, parent?: string) => void;
    /**
     * Removes a tab group and all tabs contained within the group.
     *
     * @param groupName the group to remove.
     * @return boolean true if the group existed and was removed, otherwise false.
     */
    removeTabGroup: (groupName: string) => boolean;
    /**
     * Fired whenever a tab is shown
     *
     * @param <TEvent> the tab which was shown
     */
    tabShown: SimpleEvent<HTMLDivElement>;
    /**
     * Builds a template into a new node using the provided rules.
     *
     * @param template the template to clone.
     * @param target the parent node to append the cloned template to.
     * @param rules the rules to apply to the cloned template before appending it to the target.
     */
    buildTemplate: (template: string | HTMLTemplateElement, target: string | HTMLElement, rules: TemplateRule[]) => void;
    /**
     * Sends a non-critical alert to the user, should be used in place of [[UIExtensionExports.alert]] if possible as it is non-blocking.
     *
     * @param text the text (not html) to display in the notification.
     * @param displayTime the number of seconds to display the alert for. Default of 2 seconds.
     */
    notify: (text: string, displayTime?: number) => void;
    /**
     * Requires a response from the user with a modal box.
     *
     * @param html the html to be set for the modal body.
     * @param buttons buttons that the user can click to close the modal, for each item, if it is a string it will be set as the text with the default style, or the text can be specified explicitly. If no buttons are specified, a generic OK button will be used.
     * @param callback will be called when the alert is closed as a result of the user clicking on one of the provided buttons. It will be passed a single argument with the text of the button clicked.
     */
    alert: (html: string, buttons?: Array<{text: string, style?: string}|string>, callback?: (text: string) => void) => void;
    /**
     * Utility method for getting text from the user.
     *
     * @param text displayed to the user when asking for input
     * @param callback will be called once the user clicks OK with the input, or an empty string if no input was supplied.
     */
    prompt: (text: string, callback?: (response: string) => void) => void;
    /**
     * A tab manager which can be used within extension pages.
     */
    TabManager: typeof TabManager;
}

MessageBot.registerExtension('ui', function(ex) {
    if (ex.isNode) {
        throw new Error('Node bots cannot run this extension.');
    }
    ex.uninstall = function() {
        throw new Error("The UI extension cannot be removed once loaded");
    };

    // Page creation

    document.body.innerHTML = fs.readFileSync(__dirname + '/layout.html', 'utf8');
    document.head.querySelectorAll('link').forEach(el => el.remove());
    // Bulma tries to make this scroll
    let el = document.createElement('style');
    el.textContent = require('./style.scss').css;
    document.head.appendChild(el);

    // Why doesn't this already exist in TypeScript?
    interface HTMLDetailsElement extends HTMLElement {
        open: boolean;
    }

    // Polyfill for Edge
    if (!('open' in document.createElement('details'))) {
        let style = document.createElement('style');
        style.textContent += `details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; } details[open] > summary:before { transform: rotate(90deg); }`;
        document.head.appendChild(style);

        window.addEventListener('click', function(event) {
            let target = event.target as HTMLElement;

            if (target.tagName == 'SUMMARY') {
                let details = target.parentNode as HTMLDetailsElement;

                if (!details) {
                    return;
                }

                if (details.getAttribute('open')) {
                    details.open = false;
                    details.removeAttribute('open');
                } else {
                    details.open = true;
                    details.setAttribute('open', 'open');
                }
            }
        });
    }

    let tabManager = new TabManager(
        document.querySelector('.nav-slider-container .nav-slider') as HTMLElement,
        document.querySelector('#container') as HTMLElement
    );

    // Exports
    const { notify, alert, prompt }: Pick<UIExtensionExports, 'notify' | 'alert' | 'prompt'> = require('./notifications');

    let uiExports: UIExtensionExports = {
        toggleMenu: () => {
            (document.querySelector('.nav-slider-container .nav-slider') as Element).classList.toggle('is-active');
        },
        addTab: (text: string, groupName?: string) => tabManager.addTab(text, groupName),
        removeTab: (content: HTMLDivElement) => tabManager.removeTab(content),
        addTabGroup: (text: string, groupName: string, parent?: string) => {
            return tabManager.addTabGroup(text, groupName, parent);
        },
        removeTabGroup: (groupName: string) => tabManager.removeTabGroup(groupName),
        tabShown: tabManager.tabShown,

        buildTemplate,
        notify,
        alert,
        prompt,
        TabManager,
    };

    ex.exports = uiExports;

    // Showing / hiding the menu
    for (let node of document.querySelectorAll('.nav-slider-toggle')) {
        node.addEventListener('click', uiExports.toggleMenu);
    }
});
