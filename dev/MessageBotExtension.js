/*jshint
	browser:	true,
	devel: 		true
*/

function MessageBotExtension(namespace) {
	//Handle old extensions which won't work.
	if (this instanceof MessageBotExtension) {
		alert('Sorry, ' + namespace + ' is using an older version of the API which is no longer supported. It will show that it has been uninstalled but its config is still in place.\n\nPlease contact the developer of the extension for support.');
		window.bot.removeExtension(namespace);
		throw new Error('Outdated extension, ID:' + namespace, 0, 0);
	}
	
	var extension = {
		id: namespace, 
		bot: window.bot, 
		core: window.bot.core, 
		settingsTab: null,
		mainTabs: {}
	};
	
	/**
	 * Used to add a settings tab for this extension. After creation, use extension.settingsTab
	 * to refer to the div which is owned by the extension.
	 *
	 * @param string tabText the text to display on the tab
	 * @return void
	 */
	extension.addSettingsTab = function addSettingsTab(tabText) {
		this.settingsTab = this.bot.addSettingsTab('settings_' + this.id, tabText);
	};
	
	/**
	 * Used to add a tab next under the Messages tab.
	 * Adds the tab to the extension.mainTabs object.
	 *
	 * @param string tabId the ID of the tab to add
	 * @param string tabText the text which to place on the tab
	 * @return void
	 */
	extension.addMainTab = function addMainTab(tabId, tabText) {
		this.mainTabs[tabId] = this.bot.addMainTab('main_' + this.id + '_' + tabId, tabText);
	};
	
	/**
	 * Used to check if the this extension is set to automatically launch, can be used to create 'run once by default' extensions.
	 *
	 * @return boolean true if the extension auto launches.
	 */
	extension.autoLaunch = function autoLaunch() {
		return this.bot.extensions.indexOf(this.id) > -1;
	};

	/**
	 * Used to change whether or not the extension will be 
	 * Automatically loaded the next time the bot is launched.
	 * 
	 * @param boolean shouldAutoload 
	 * @return void
	 */
	extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
		this.bot.setAutoLaunch(this.id, shouldAutoload);
	};

	/**
	 * Used to add a listener to for join messages
	 * 
	 * @param string uniqueId the id of the listener
	 * @param function the function called whenever a join message arrives
	 * @return boolean true on success, false otherwise
	 */
	extension.addJoinListener = function addJoinListener(uniqueId, listener) {
		return this.core.addJoinListener(this.id + '_' + uniqueId, listener);
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
		return this.core.addLeaveListener(this.id + '_' + uniqueId, listener);
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
		return this.core.addTriggerListener(this.id + '_' + uniqueId, listener);
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
		return this.core.addServerListener(this.id + '_' + uniqueId, listener);
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
		return this.core.addOtherListener(this.id + '_' + uniqueId, listener);
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
		return this.core.addBeforeSendListener(this.id + '_' + uniqueId, listener);
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
