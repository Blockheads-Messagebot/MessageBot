import { SimpleEvent } from "../../libraries/simpleevent";

/**
 * Class which manages a set of tabs, exported by the UI extension.
 * Extensions may use this class to manage tabs internally.
 */
export class TabManager {
    private tabUID = 0;
    private navigationRoot: HTMLElement;
    private contentRoot: HTMLElement;

    /**
     * Fired whenever a tab is shown
     *
     * @param <TEvent> the tab which was shown
     */
    public tabShown = new SimpleEvent<HTMLDivElement>();

    /**
     * Creates a new TabManager instance.
     *
     * @param navigationRoot the root element for navigation items
     * @param contentRoot the root element which content should be added to.
     */
    constructor(navigationRoot: HTMLElement, contentRoot: HTMLElement) {
        this.navigationRoot = navigationRoot;
        this.contentRoot = contentRoot;

        this.navigationRoot.addEventListener('click', (event) => {
            let tabNav = event.target as HTMLSpanElement;
            let tabName = tabNav.dataset.tabName;
            let content = this.contentRoot.querySelector(`[data-tab-name=${tabName}]`) as HTMLDivElement;

            if (!tabName || !content) {
                return;
            }

            for (let el of this.contentRoot.querySelectorAll('.visible')) {
                el.classList.remove('visible');
            }
            content.classList.add('visible');

            for (let el of this.navigationRoot.querySelectorAll('.is-active')) {
                el.classList.remove('is-active');
            }
            tabNav.classList.add('is-active');

            this.tabShown.dispatch(content);
        });
    }

    /**
     * Removes all tabs in the collection. Does not remove tab groups.
     */
    removeAll() {
        for (let i = this.contentRoot.children.length; i >= 0; i--) {
            this.removeTab(this.contentRoot.children[i] as HTMLDivElement);
        }
    }

    /**
     * Adds a tab to the content root, the children of the returned <div> may be modified however you like.
     *
     * @param text the text which should appear in the menu for the tab
     * @param groupName the tab group to add the tab to, if omitted the tab will be added to the root navigation.
     * @return the div which the tab content should be placed in.
     */
    addTab(text: string, groupName?: string): HTMLDivElement {
        let tabName = 'tab_' + this.tabUID++;

        let tab = document.createElement('span');
        let content = document.createElement('div');

        tab.textContent = text;
        tab.classList.add('nav-item');
        tab.dataset.tabName = content.dataset.tabName = tabName;

        let navParent: HTMLElement;
        if (groupName) {
            navParent = this.navigationRoot.querySelector(`[data-tab-group=${groupName}]`) as HTMLElement;
            if (!navParent) {
                throw new Error(`Tab group ${groupName} does not exist.`);
            }
        } else {
            navParent = this.contentRoot;
        }

        navParent.appendChild(tab);
        this.contentRoot.appendChild(content);

        return content;
    }

    /**
     * Removes a tab from the tab root, if it exists, otherwise has no effect.
     *
     * @param content the tab which should be removed.
     */
    removeTab(content: HTMLDivElement): boolean {
        let nav = this.navigationRoot.querySelector(`.nav-item[data-tab-name=${content.dataset.tabName}]`);
        if (nav) {
            nav.remove();
            content.remove();
            return true;
        }
        return false;
    }

    /**
     * Adds a new tab group to the tab content, if it does not already exist. If it exists, the text of the group will be updated. Supplying a new parent name will not update the parent. (TODO)
     *
     * @param text the text to display in group dropdown
     * @param groupName the name of the group to create or update
     * @param parent the parent of this group, if not provided the group will be added to the root of the navigation tree.
     */
    addTabGroup(text: string, groupName: string, parent?: string): void {
        let group = this.navigationRoot.querySelector(`[data-tab-group="${groupName}"]`);
        if (group) {
            (group.querySelector('summary') as Element).textContent = text;
            return;
        }

        group = document.createElement('details');
        let summary = document.createElement('summary');
        summary.textContent = text;
        group.appendChild(summary);

        let parentNav = this.navigationRoot.querySelector(`[data-tab-group="${parent}"]`);
        if (parentNav) {
            parentNav.appendChild(group);
        } else {
            throw new Error('Parent group does not exist.');
        }
    }

    /**
     * Removes a tab group and all tabs contained within the group.
     *
     * @param groupName the group to remove.
     * @return boolean true if the group existed and was removed, otherwise false.
     */
    removeTabGroup(groupName: string): boolean {
        let group = this.navigationRoot.querySelector(`[data-tab-group="${groupName}"]`);

        if (!group) {
            return false;
        }

        for (let item of group.querySelectorAll('span')) {
            (this.contentRoot.querySelector(`[data-tab-name="${item.dataset.tabName}"]`) as Element).remove();
        }
        group.remove();

        return true;
    }
}