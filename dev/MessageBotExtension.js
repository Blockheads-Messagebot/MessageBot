function MessageBotExtension(namespace) { //jshint ignore:line
    var extension = {
        id: namespace,
        bot: window.bot,
        ui: window.botui,
        hook: window.hook,
    };

    /**
     * Used to add a tab to the bot's navigation.
     *
     * @param string tabText
     * @param string tabId
     * @param string tabGroup optional CSS selector that the tab should be added to.
     * @return void
     */
    extension.addTab = function addTab(tabText, tabId, tabGroup = '#mainNavContents') {
        extension.ui.addTab(tabText, this.id + '_' + tabId, tabGroup);
    };

    /**
     * Used to add a tab group to the bot's navigation.
     *
     * @param string text
     * @param string groupId - Auto prefixed with the extension ID to avoid conflicts
     * @return void
     */
    extension.addTabGroup = function addTabGroup(tabText, tabId) {
        this.ui.addTabGroup(tabText, this.id + '_' + tabId);
    };

    /**
     * Used to check if the this extension is set to automatically launch, can be used to create 'run once by default' extensions.
     *
     * @return boolean true if the extension auto launches.
     */
    extension.autoLaunch = function autoLaunch() {
        return this.bot.extensions.includes(this.id);
    };

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @param boolean shouldAutoload
     * @return void
     */

     //TODO: Save config here.
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        window.bhfansapi.autoloadExtension(this.id, shouldAutoload);
        extension.hook.check('extension.added', this.id);
    };

    /**
     * Used to add a listener to for join messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a join message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addJoinListener = function addJoinListener(uniqueId, listener) {
        return this.core.addJoinListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on join messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeJoinListener = function removeJoinListener(uniqueId) {
        this.core.removeJoinListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for leave messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a leave message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addLeaveListener = function addLeaveListener(uniqueId, listener) {
        return this.core.addLeaveListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on leave messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeLeaveListener = function removeLeaveListener(uniqueId) {
        this.core.removeLeaveListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for trigger messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a trigger message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addTriggerListener = function addTriggerListener(uniqueId, listener) {
        return this.core.addTriggerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on trigger messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeTriggerListener = function removeTriggerListener(uniqueId) {
        this.core.removeTriggerListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for server messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a server message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addServerListener = function addServerListener(uniqueId, listener) {
        return this.core.addServerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on server messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeServerListener = function removeServerListener(uniqueId) {
        this.core.removeServerListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for other messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever an other message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addOtherListener = function addOtherListener(uniqueId, listener) {
        return this.core.addOtherListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on other messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeOtherListener = function removeOtherListener(uniqueId) {
        this.core.removeOtherListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to the send function
     * which is called by every message before being sent.
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a message is sent
     * @return boolean true on success, false otherwise
     */
    extension.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
        return this.core.addBeforeSendListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on the send function
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
        this.core.removeBeforeSendListener(this.id + '_' + uniqueId);
    };

    return extension;
}
