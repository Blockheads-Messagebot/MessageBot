/*global
	MessageBotCore,
	MessageBotUI
*/

function MessageBot() { //jshint ignore:line
	var bot = {
		devMode: false,
		core: MessageBotCore(),
		ui: MessageBotUI(),
		uMID: 0,
		extensions: [],
		preferences: {},
		extensionURL: '//blockheadsfans.com/messagebot/extension/{id}/code/raw'
	};
	bot.version = bot.core.version;

	//Save functions
	{
		/**
		 * Method used to save the bot's current config.
		 * Automatically called whenever the config changes
		 *
		 * @return void
		 */
		bot.saveConfig = function saveConfig() {
			var utilSaveFunc = (wrapper, saveTo) => {
				var wrappers = wrapper.children;
				var selects,
					joinCounts,
					tmpMsgObj = {};
				for (var i = 0; i < wrappers.length; i++) {
					tmpMsgObj.message = wrappers[i].querySelector('.m').value;
					if (wrapper.id != 'aMsgs') {
						selects = wrappers[i].querySelectorAll('select');
						joinCounts = wrappers[i].querySelectorAll('input[type="number"]');
						tmpMsgObj.group = selects[0].value;
						tmpMsgObj.not_group = selects[1].value;
						tmpMsgObj.joins_low = joinCounts[0].value;
						tmpMsgObj.joins_high = joinCounts[1].value;
					}
					if (wrapper.id == 'tMsgs') {
						if (bot.preferences.disableTrim) {
							tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
						} else {
							tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();
						}
					}
					saveTo.push(tmpMsgObj);
					tmpMsgObj = {};
				}
			};

			bot.joinArr = [];
			bot.leaveArr = [];
			bot.triggerArr = [];
			bot.announcementArr = [];
			utilSaveFunc(document.getElementById('lMsgs'), bot.leaveArr);
			utilSaveFunc(document.getElementById('jMsgs'), bot.joinArr);
			utilSaveFunc(document.getElementById('tMsgs'), bot.triggerArr);
			utilSaveFunc(document.getElementById('aMsgs'), bot.announcementArr);

			localStorage.setItem('joinArr' + window.worldId, JSON.stringify(bot.joinArr));
			localStorage.setItem('leaveArr' + window.worldId, JSON.stringify(bot.leaveArr));
			localStorage.setItem('triggerArr' + window.worldId, JSON.stringify(bot.triggerArr));
			localStorage.setItem('announcementArr' + window.worldId, JSON.stringify(bot.announcementArr));
			localStorage.setItem('mb_extensions', JSON.stringify(bot.extensions));
			localStorage.setItem('mb_version', bot.version);
		};

		/**
		 * Method used to create a backup for the user.
		 */
		bot.generateBackup = function generateBackup() {
			bot.ui.alert('<p>Copy the following code to a safe place.<br>Size: ' + Object.keys(localStorage).reduce((c, l) => c + l).length + ' bytes</p><p>' + bot.stripHTML(JSON.stringify(localStorage)) + '</p>');
		};

		/**
		 * Method used to load a user's backup if possible.
		 */
		bot.loadBackup = function loadBackup() {
			bot.ui.alert('Enter the backup code:<textarea style="width:99%;height:10em;"></textarea>',
						[
							{text:'Load backup & restart bot', style:'success', action: function() {
								let code = document.querySelector('#alert textarea').value;
								try {
									code = JSON.parse(code);
									if (code === null) {
										throw new Error('Invalid backup');
									}
								} catch (e) {
									bot.ui.notify('Invalid backup code. No action taken.');
									return;
								}

								localStorage.clear();

								Object.keys(code).forEach((key) => {
									localStorage.setItem(key, code[key]);
								});

								location.reload();
							}},
							{text:'Cancel'}
						]);
		};

		/**
		 * Function used to save the bot preferences to the browser.
		 */
		bot.savePrefs = function savePrefs() {
			var prefs = {};
			prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
			prefs.maxResponses = parseInt(document.querySelector('#mb_resp_max').value);
			prefs.regexTriggers = document.querySelector('#mb_regex_triggers').checked;
			prefs.disableTrim = document.querySelector('#mb_disable_trim').checked;
			prefs.notify = document.querySelector('#mb_notify_message').checked;
			bot.preferences = prefs;
			localStorage.setItem('mb_preferences', JSON.stringify(prefs));
		};
	}

	//Bot & UI control functions
	{
		/**
		 * Method used to start the bot and add event listeners
		 *
		 * @return void
		 */
		bot.start = function start() {
			bot.core.addJoinListener('mb_join', 'bot', bot.onJoin);
			bot.core.addLeaveListener('mb_leave', 'bot', bot.onLeave);
			bot.core.addTriggerListener('mb_trigger', 'bot', bot.onTrigger);
			bot.core.addTriggerListener('mb_notify', 'bot', (message) => {
				if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
					bot.ui.notify(message.name + ': ' + message.message);
				}
			});
			bot.core.addBeforeSendListener('mb_tweaks', 'bot', (message) => {
				return message.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
			});
			bot.announcementCheck(0);
			bot.core.startListening();
		};

		/**
		 * Function to add a tab anywhere on the page
		 *
		 * @param string navID the id to the div which holds the tab navigation.
		 * @param string contentID the id to the div which holds the divs of the tab contents.
		 * @param string tabName the name of the tab to add.
		 * @param string tabText the text to display on the tab.
		 * @return mixed false on failure, the content div on success.
		 */
		bot.addTab = function addTab(navID, contentID, tabName, tabText) {
			console.warn('bot.addTab has been depricated and will be removed in the next minor release. Use extension.ui.addInnerTab instead.');
			bot.ui.addInnerTab(navID, contentID, tabName, tabText);
		};

		/**
		 * Removes a tab by its name. Should not be directly called by extensions.
		 *
		 * @param string tabName the name of the tab to be removed.
		 * @return bool true on success, false on failure.
		 */
		bot.removeTab = function removeTab(tabName) {
			console.warn('bot.removeTab has been depricated and will be removed in the next minor release. Use extension.ui.removeInnerTab instead.');
			bot.ui.removeInnerTab(tabName);
		};

		/**
		 * Event handler that should be attatched to the div
		 * holding the navigation for a tab set.
		 *
		 * @param eventArgs e
		 * @return void
		 */
		bot.changeTab = function changeTab(e) {
			console.warn('bot.changeTab has been depricated and will be removed in the next minor release. Use extension.ui.changeTab instead.');
			bot.ui.changeTab(e);
		};
	}

	//Interaction functions
	{
		/**
		 * Function used to add an empty message
		 * Should only be called by the user tapping a + to add messages
		 *
		 * @param eventArgs e
		 * @return void
		 */
		bot.addEmptyMsg = function addEmptyMsg(e) {
			var containerElem = e.target.parentElement.querySelector('div');
			var template;
			if (containerElem.id == 'jMsgs' || containerElem.id == 'lMsgs') {
				template = document.getElementById('jlTemplate');
			} else if (containerElem.id == 'tMsgs') {
				template = document.getElementById('tTemplate');
			} else {
				template = document.getElementById('aTemplate');
			}
			bot.addMsg(containerElem, template, {});

			e.stopPropagation();
		};

		/**
		 * Method used to delete messages, calls the save config function if needed.
		 *
		 * @param eventArgs e
		 * @return void;
		 */
		bot.deleteMsg = function deleteMsg(e) {
			bot.ui.alert('Really delete this message?',
						[
							{text: 'Delete', style: 'danger', thisArg: e.target.parentElement, action: function() {
								this.remove();
								bot.saveConfig();
							}},
							{text: 'Cancel'}
						]);
			e.stopPropagation();
		};
	}

	//Store & extension control functions
	{
		/**
		 * Method used to add an extension to the bot.
		 *
		 * @param string extensionId the ID of the extension to load
		 * @return void
		 */
		bot.addExtension = function addExtension(extensionId) {
			var el = document.createElement('script');
			el.src = bot.extensionURL.replace('{id}', extensionId);
			el.crossOrigin = 'anonymous';
			document.head.appendChild(el);
		};

		/**
		 * Method used to add an extension manually, by ID or url.
		 *
		 * @return void
		 */
		bot.manuallyAddExtension = function manuallyAddExtension() {
			bot.ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>',
						[
							{text: 'Add', style: 'success', action: function() {
								let extRef = document.querySelector('#alert input').value;
								if (extRef.length) {
									if (extRef.indexOf('http') === 0) {
										let el = document.createElement('script');
										el.src = extRef;
										document.head.appendChild(el);
									} else {
										bot.addExtension(extRef);
									}
								}
							}},
							{text: 'Cancel'}
						]);
		};

		/**
		 * Tries to remove all traces of an extension
		 * Calls the uninstall function of the extension if it exists
		 * Removes the main tabs and settings tab of the extension
		 * Removes the extension from the bot autoloader
		 *
		 * @param string extensionId the ID of the extension to remove
		 * @return void;
		 */
		bot.removeExtension = function removeExtension(extensionId) {
			if (typeof window[extensionId] != 'undefined') {
				if (typeof window[extensionId].uninstall == 'function') {
					window[extensionId].uninstall();
				}

				//To be removed next minor version, extensions should now remove their tabs in an uninstall function.
				bot.ui.removeTab('settings_' + extensionId);
				Object.keys(window[extensionId].mainTabs).forEach((key) => {
					bot.removeTab('main_' + extensionId + '_' + key);
				});
				//To make it simpler for devs to allow their extension to be added and removed without a page launch.
				window[extensionId] = undefined;
			}
			var extIn = bot.extensions.indexOf(extensionId);
			if (extIn > -1) {
				bot.extensions.splice(extIn, 1);
				bot.saveConfig();

				bot.listExtensions();

				var button = document.querySelector('div[extension-id=' + extensionId + '] > button');
				if (button !== null) {
					button.textContent = 'Removed';
					setTimeout((function () {
						bot.textContent = 'Install';
					}).bind(button), 3000);
				}
			}
		};

		/**
		 * Used to create and display a list of installed extensions that may not appear in the store.
		 */
		bot.listExtensions = function listExtensions() {
			let el = document.getElementById('mb_ext_list');
			if (!bot.extensions.length) {
				el.innerHTML = '<p>No extensions installed</p>';
				return;
			}

			bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/extension/name',
				{extensions: JSON.stringify(bot.extensions)})
				.then((resp) => {
					console.log('List Extensions: ', resp);
					if (resp.status == 'ok') {
						el.innerHTML = resp.extensions.reduce((html, ext) => {
							return `${html}<li>${bot.stripHTML(ext.name)} (${ext.id}) <a onclick="bot.removeExtension(\'${ext.id}\');" class="button button-sm">Remove</a></li>`;
							}, '<ul style="margin-left:1.5em;">') + '</ul>';
					} else {
						throw new Error(resp.message);
					}
				}).catch((err) => {
					console.error(err);
					bot.core.addMessageToPage(`<span style="color:#f00;">Fetching extension names failed with error: ${bot.stripHTML(err.message)}</span>`, true);
					el.innerHTML = 'Error fetching extension names';
				});
		};

		/**
		 * Used to choose whether or not an extension will automatically launch the next time the bot loads.
		 *
		 * @param string exensionId the id of the extension
		 * @param boolean autoLaunch whether or not to launch the extension
		 * @return void
		 */
		bot.setAutoLaunch = function setAutoLaunch(extensionId, autoLaunch) {
			if (bot.extensions.indexOf(extensionId) < 0 && autoLaunch) {
				bot.extensions.push(extensionId);
				bot.listExtensions();
			} else if (!autoLaunch) {
				var extIn = bot.extensions.indexOf(extensionId);
				if (extIn > -1) {
					bot.extensions.splice(extIn, 1);
				}
			}
			bot.saveConfig();
		};

		/**
		 * Function that handles installation / removal requests by the user
		 *
		 * @param EventArgs e the details of the request
		 * @return void
		 */
		bot.extActions = function extActions(e) {
			var extId = e.target.parentElement.getAttribute('extension-id');
			var button = document.querySelector('div[extension-id="' + extId + '"] > button');
			//Handle clicks on the div itself, not a child elem
			extId = extId  || e.target.getAttribute('extension-id');
			if (e.target.tagName == 'BUTTON') {
				if (e.target.textContent == 'Install') {
					bot.addExtension(extId);
					button.textContent = 'Remove';
				} else {
					bot.removeExtension(extId);

					window[extId] = undefined;
				}
			}
		};
	}

	//Core listeners
	{
		/**
		 * Function called whenever someone joins the server.
		 * Should only be called by the core.
		 *
		 * @param object data an object containing the name and ip of the player
		 */
		bot.onJoin = function onJoin(data) {
			bot.joinArr.forEach((msg) => {
				if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
					var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
					bot.core.send(toSend);
				}
			});
		};

		/**
		 * Function called whenever someone leaves the server.
		 * Should only be called by the core.
		 *
		 * @param object data an object containing the name and ip of the player
		 */
		bot.onLeave = function onLeave(data) {
			bot.leaveArr.forEach((msg) => {
				if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
					var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
					bot.core.send(toSend);
				}
			});
		};

		/**
		 * Function called whenever someone says something in chat.
		 * Should not be called except by the core
		 *
		 * @param object data an object containing the message and info on it
		 */
		bot.onTrigger = function onTrigger(data) {
			var triggerMatch = (trigger, message) => {
				if (bot.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			};
			let sentMessages = 0;

			bot.triggerArr.forEach((msg) => {
				if (triggerMatch(msg.trigger, data.message) && bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {

					var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{ip}}', bot.core.getIP(data.name));
					if (sentMessages < bot.preferences.maxResponses) {
						sentMessages++;
						bot.core.send(toSend);
					}
				}
			});
		};

		/**
		 * Function called to send the next announcement, should only be called once.
		 *
		 * @param number ind the index of the announcement to send.
		 */
		bot.announcementCheck = function announcementCheck(ind) {
			var i = ind;
			if (ind == bot.announcementArr.length) {
				i = 0;
			}
			if (typeof bot.announcementArr[i] == 'object') {
				bot.core.send(bot.announcementArr[i].message);
			}
			setTimeout(bot.announcementCheck.bind(bot), bot.preferences.announcementDelay * 60000, ++i);
		};
	}

	//Utility functions
	{
		/**
		 * Utility function used to strip HTML tags.
		 *
		 * @param string html the string with html to strip
		 * @return string
		 */
		bot.stripHTML = function stripHTML(html) {
			return bot.replaceAll(bot.replaceAll(html, '<', '&lt;'), '>', '&gt;');
		};

		/**
		 * Utility function used to easily replace all occurances
		 * of a string with a string in a string. Case sensitive.
		 *
		 * @param string string the string which is being searched
		 * @param string find the string which is searched for
		 * @param string replace the string which all occurances of find is replaced with
		 * @return string the string after the replace has occured.
		 */
		bot.replaceAll = function replaceAll(string, find, replace) {
			return string.replace(new RegExp(find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), replace);
		};

		/**
		 * Should be called every time a new <template> element is added to the page
		 *
		 * @return void
		 */
		bot.fixTemplates = function fixTemplates() {
			if (!('content' in document.createElement('template'))) {
				var qPlates = document.getElementsByTagName('template'),
					plateLen = qPlates.length,
					elPlate,
					qContent,
					contentLen,
					docContent;

				for (var x = 0; x < plateLen; ++x) {
					elPlate = qPlates[x];
					qContent = elPlate.childNodes;
					contentLen = qContent.length;
					docContent = document.createDocumentFragment();

					while (qContent[0]) {
						docContent.appendChild(qContent[0]);
					}

					elPlate.content = docContent;
				}
			}
		};

		/**
		 * Used to add messages, can be called by extensions.
		 *
		 * @param object container the div to add the message to - also determines the type
		 * @param object template the template to use
		 * @param object saveObj any values which should not be default.
		 * @return void
		 */
		bot.addMsg = function addMsg(container, template, saveObj) {
			var content = template.content;
			content.querySelector('div').id = 'm' + bot.uMID;
			content.querySelector('.m').value = saveObj.message || '';
			if (template.id != 'aTemplate') {
				var numInputs = content.querySelectorAll('input[type="number"]');
				numInputs[0].value = saveObj.joins_low || 0;
				numInputs[1].value = saveObj.joins_high || 9999;
				if (template.id == 'tTemplate') {
					if (saveObj.trigger) {
						saveObj.trigger = (bot.preferences.disableTrim) ? saveObj.trigger : saveObj.trigger.trim();
					}
					content.querySelector('.t').value = saveObj.trigger || '';
				}
			}
			//Groups done after appending or it doesn't work.
			container.appendChild(document.importNode(content, true));

			if (template.id != 'aTemplate') {
				var selects = document.querySelectorAll('#m' + bot.uMID + ' > select');

				selects[0].value = saveObj.group || 'All';

				selects[1].value = saveObj.not_group || 'Nobody';
			}
			document.querySelector('#m' + bot.uMID + ' > a').addEventListener('click', bot.deleteMsg.bind(bot), false);

			bot.uMID++;
		};

		/**
		 * Function used to see if users are in defined groups.
		 *
		 * @param string group the group to check
		 * @param string name the name of the user to check
		 * @return boolean
		 */
		bot.checkGroup = function checkGroup(group, name) {
			if (group == 'All') {
				return true;
			}
			if (group == 'Admin') {
				return bot.core.adminList.indexOf(name) !== -1;
			}
			if (group == 'Mod') {
				return bot.core.modList.indexOf(name) !== -1;
			}
			if (group == 'Staff') {
				return bot.core.staffList.indexOf(name) !== -1;
			}
			if (group == 'Owner') {
				return bot.core.ownerName == name;
			}
			return false;
		};

		/**
		 * Compares the numbers given, used internally for joins.
		 *
		 * @param number low the lowest number allowed
		 * @param number high the highest number allowed
		 * @param number actual the number to check
		 * @return boolean true if actual falls between low and high, false otherwise.
		 */
		bot.checkJoins = function checkJoins(low, high, actual) {
			return low <= actual && actual <= high;
		};

		/**
		 * Can be used to check if an extension is compatable as API changes are only made on minor versions
		 * Accepts a version string like 5.1.* or >5.1.0 or <5.1.0
		 *
		 * @param string target the target version pattern
		 * @return bool
		 */
		bot.versionCheck = function versionCheck(target) {
			var vArr = bot.version.split('.');
			var tArr = target.replace(/[^0-9.*]/g, '').split('.');
			if (/^[0-9.*]+$/.test(target)) {
				return tArr.every(function(el, i) {
					return (el == vArr[i] || el == '*');
				});
			} else if (/^>[0-9.]+$/.test(target)) {
				for (let i = 0; i < tArr.length; i++) {
					if (Number(vArr[i]) > Number(tArr[i])) {
						return true;
					}
				}
				return false;
			} else if (/^<[0-9.]+$/.test(target)) {
				for (let i = 0; i < tArr.length; i++) {
					if (Number(vArr[i]) > Number(tArr[i])) {
						return true;
					}
				}
				return false;
			}
			return false;
		};
	}

	//Setup function, used to write the config page and attatch event listeners.
	(function(bot) {
		let checkPref = (type, name, defval) => {
			if (typeof bot.preferences[name] != type) {
				bot.preferences[name] = defval;
			}
		};
		let addListener = (selector, type, func, thisVal = undefined) => {
			document.querySelector(selector).addEventListener(type, func.bind(thisVal));
		};

		var str = localStorage.getItem('mb_preferences');
		bot.preferences = str === null ? {} : JSON.parse(str);
		checkPref('number', 'announcementDelay', 10);
		checkPref('number', 'maxResponses', 2);
		checkPref('boolean', 'regexTriggers', false);
		checkPref('boolean', 'disableTrim', false);
		checkPref('boolean', 'notify', true);

		bot.fixTemplates();

		var addMsgElems = document.querySelectorAll('span.add');
		for (let i = 0; i < addMsgElems.length; i++) {
			addMsgElems[i].addEventListener('click', bot.addEmptyMsg.bind(bot), false);
		}

		document.querySelector('#mb_console input').setAttribute('onkeydown', 'bot.core.enterCheck(event, bot.core)');

		addListener('#jMsgs', 'change', bot.saveConfig, bot);
		addListener('#lMsgs', 'change', bot.saveConfig, bot);
		addListener('#tMsgs', 'change', bot.saveConfig, bot);
		addListener('#aMsgs', 'change', bot.saveConfig, bot);

		addListener('#mb_settings', 'change', bot.savePrefs, bot);

		addListener('#mb_backup_save', 'click', bot.generateBackup, bot);
		addListener('#mb_backup_load', 'click', bot.loadBackup, bot);
		addListener('#exts', 'click', bot.extActions, bot);
		addListener('#mb_load_man', 'click', bot.manuallyAddExtension, bot);

		//Handle preferences
		document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
		document.querySelector('#mb_resp_max').value = bot.preferences.maxResponses;
		document.querySelector('#mb_regex_triggers').checked = ((bot.preferences.regexTriggers) ? 'checked' : '');
		document.querySelector('#mb_disable_trim').checked = ((bot.preferences.disableTrim) ? 'checked' : '');
		document.querySelector('#mb_notify_message').checked = ((bot.preferences.notify) ? 'checked' : '');
	}(bot));

	//Load the saved config, including extensions
	(function(bot) {
		var str;
		str = localStorage.getItem('joinArr' + window.worldId);
		bot.joinArr = str === null ? [] : JSON.parse(str);
		str = localStorage.getItem('leaveArr' + window.worldId);
		bot.leaveArr = str === null ? [] : JSON.parse(str);
		str = localStorage.getItem('triggerArr' + window.worldId);
		bot.triggerArr = str === null ? [] : JSON.parse(str);
		str = localStorage.getItem('announcementArr' + window.worldId);
		bot.announcementArr = str === null ? [] : JSON.parse(str);
		str = localStorage.getItem('mb_extensions');
		bot.extensions = str === null ? [] : JSON.parse(str);

		bot.extensions.forEach((ext) => {
			bot.addExtension(ext);
		});

		bot.joinArr.forEach((msg) => {
			bot.addMsg(document.getElementById('jMsgs'), document.getElementById('jlTemplate'), msg);
		});
		bot.leaveArr.forEach((msg) => {
			bot.addMsg(document.getElementById('lMsgs'), document.getElementById('jlTemplate'), msg);
		});
		bot.triggerArr.forEach((msg) => {
			bot.addMsg(document.getElementById('tMsgs'), document.getElementById('tTemplate'), msg);
		});
		bot.announcementArr.forEach((msg) => {
			bot.addMsg(document.getElementById('aMsgs'), document.getElementById('aTemplate'), msg);
		});

		bot.saveConfig();
	}(bot));

	//Initialize the store page
	bot.core.ajax.getJSON('//blockheadsfans.com/messagebot/extension/store')
		.then((data) => {
			console.log(data);
			let content = document.getElementById('extTemplate').content;

			if (data.status == 'ok') {
				data.extensions.forEach((extension) => {
					content.querySelector('h4').textContent = extension.title;
					content.querySelector('span').innerHTML = extension.snippet;
					content.querySelector('.ext').setAttribute('extension-id', extension.id);
					content.querySelector('button').textContent = bot.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

					document.getElementById('exts').appendChild(document.importNode(content, true));
				});
			} else {
				document.getElementById('exts').innerHTML += data.message;
			}

			bot.listExtensions();
		})
		.catch((err) => { console.error(err); });

	return bot;
}
