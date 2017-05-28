import { SimpleEvent } from "../../libraries/simpleevent";
/**
 * Class which manages a set of tabs, exported by the UI extension.
 * Extensions may use this class to manage tabs internally.
 */
export declare class TabManager {
    private tabUID;
    private navigationRoot;
    private contentRoot;
    /**
     * Fired whenever a tab is shown
     *
     * @param <TEvent> the tab which was shown
     */
    tabShown: SimpleEvent<HTMLDivElement>;
    /**
     * Creates a new TabManager instance.
     *
     * @param navigationRoot the root element for navigation items
     * @param contentRoot the root element which content should be added to.
     */
    constructor(navigationRoot: HTMLElement, contentRoot: HTMLElement);
    /**
     * Adds a tab to the content root, the children of the returned <div> may be modified however you like.
     *
     * @param text the text which should appear in the menu for the tab
     * @param groupName the tab group to add the tab to, if omitted the tab will be added to the root navigation.
     * @return the div which the tab content should be placed in.
     */
    addTab: (text: string, groupName?: string | undefined) => HTMLDivElement;
    /**
     * Removes a tab from the tab root, if it exists, otherwise has no effect.
     *
     * @param content the tab which should be removed.
     */
    removeTab: (content: HTMLDivElement) => boolean;
    /**
     * Adds a new tab group to the tab content, if it does not already exist. If it exists, this function will throw.
     *
     * @param text the text to display in group dropdown
     * @param groupName the name of the group to create or update
     * @param parent the parent of this group, if not provided the group will be added to the root of the navigation tree.
     */
    addTabGroup: (text: string, groupName: string, parent?: string | undefined) => void;
    /**
     * Removes a tab group and all tabs contained within the group.
     *
     * @param groupName the group to remove.
     * @return boolean true if the group existed and was removed, otherwise false.
     */
    removeTabGroup: (groupName: string) => boolean;
}
