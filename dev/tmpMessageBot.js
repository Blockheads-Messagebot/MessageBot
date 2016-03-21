/*jshint 
	esnext:		true, 
	browser:	true, 
	devel:		true,
	unused:		true,
	undef:		true,
	-W098
*/
/*global
	MessageBotCore
*/

function MessageBot() {
	var bot = {
		devMode: false,
		core: MessageBotCore(),
		uMID: 0,
		version: '5.0',
		extensions: [],
		preferences: {},
		extensionURL: '//blockheadsfans.com/messagebot/extension.php?id='
	};
	
	//Save functions
	{
		/**
		 * Method used to save the bot's current config. 
		 * Automatically called whenever the config changes
		 *
		 * @return void
		 */
		bot.saveConfig = function saveConfig() {
			function utilSaveFunc(wrapper, saveTo) {
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
						tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
					}
					saveTo.push(tmpMsgObj);
					tmpMsgObj = {};
				}
			}
			
			this.joinArr = [];
			this.leaveArr = [];
			this.triggerArr = [];
			this.announcementArr = [];
			utilSaveFunc(document.getElementById('jMsgs'), this.joinArr);
			utilSaveFunc(document.getElementById('lMsgs'), this.leaveArr);
			utilSaveFunc(document.getElementById('tMsgs'), this.triggerArr);
			utilSaveFunc(document.getElementById('aMsgs'), this.announcementArr);

			localStorage.setItem('joinArr' + window.worldId, JSON.stringify(this.joinArr));
			localStorage.setItem('leaveArr' + window.worldId, JSON.stringify(this.leaveArr));
			localStorage.setItem('triggerArr' + window.worldId, JSON.stringify(this.triggerArr));
			localStorage.setItem('announcementArr' + window.worldId, JSON.stringify(this.announcementArr));
			localStorage.setItem('mb_extensions', JSON.stringify(this.extensions));
			localStorage.setItem('mb_version', this.version);
		};

		/** 
		 * Method used to back up and load backups
		 */
		bot.backup = function backup(event) {
			if (event.target.id == 'mb_backup_save') {
				document.getElementById('mb_backup').innerHTML = '<p>Copy the following code to a safe place.</p><p>' + this.stripHTML(JSON.stringify(localStorage)) + '</p>';
				return;
			}

			var code = prompt('Enter the backup code');

			try {
				code = JSON.parse(code);
			} catch (e) {
				alert('Invalid backup. No action taken.');
				return;
			}

			if (code !== null) {
				Object.keys(code).forEach((function (key) {
					localStorage.setItem(key, code[key]);
				}).bind(this));

				alert('Backup loaded. Please restart the bot.');
				location.reload(true);
			}
		};

		/**
		 * Function used to save the bot preferences to the browser.
		 */
		bot.savePrefs = function savePrefs() {
		var prefs = {};
		prefs.showOnLaunch = document.querySelector('#mb_auto_show').checked;
		prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
		prefs.regexTriggers = document.querySelector('#mb_regex_triggers').checked;
		this.preferences = prefs;
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
		this.core.addJoinListener('mb_join', this.onJoin.bind(this));
		this.core.addLeaveListener('mb_leave', this.onLeave.bind(this));
		this.core.addTriggerListener('mb_trigger', this.onTrigger.bind(this));
		this.announcementCheck(0);
		this.core.startListening();
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
			if (document.querySelector('#' + navID + ' > div[tab-name="' + tabName + '"]') === null) {
				var tabNav = document.createElement('div');
				tabNav.setAttribute('tab-name', tabName);
				tabNav.textContent = this.stripHTML(tabText);
				document.getElementById(navID).appendChild(tabNav);

				var tabContent = document.createElement('div');
				tabContent.setAttribute('id', 'mb_' + tabName);
				document.getElementById(contentID).appendChild(tabContent);

				return tabContent;
			}
			return document.querySelector('#mb_' + tabName);
		};

		/**
		 * Removes a tab by its name. Should not be directly called by extensions.
		 *
		 * @param string tabName the name of the tab to be removed.
		 * @return bool true on success, false on failure.
		 */
		bot.removeTab = function removeTab(tabName) {
			if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
				document.querySelector('div[tab-name="' + tabName + '"]').outerHTML = '';
				document.querySelector('#mb_' + tabName).outerHTML = '';
				return true;
			}
			return false;
		};

		/** 
		 * Adds a tab to the settings page, should not be directly called by extensions. 
		 * 
		 * @param string tabName the name of the tab.
		 * @param string tabText the text to display on the tab.
		 * @return mixed the node which holds the tab content or false on failure.
		 */
		bot.addSettingsTab = function addSettingsTab(tabName, tabText) {
			return this.addTab('settingsTabsNav', 'settingsTabs', tabName, tabText);
		};

		/**
		 * Adds a tab to the navigation, should not be directly called by extensions.
		 * 
		 * @param string tabName the name of the tab.
		 * @param string tabText the text to display on the tab.
		 * @return mixed the node which holds the tab content or false on failure.
		 */
		bot.addMainTab = function addMainTab(tabName, tabText) {
			return this.addTab('botMainNav', 'botTabs', tabName, tabText);
		};
		
		/** 
		 * Function used to show/hide the bot
		 * Should only be called by the user tapping
		 * on a registered handler
		 *
		 * @param eventArgs e
		 * @return void
		 */
		bot.toggleBot = function toggleBot(e) {
			var el = document.getElementById('botContainer');
			if (el.style.display !== 'none') {
				el.style.display = 'none';
			} else {
				el.style.display = 'block';
			}
			e.stopPropagation();
		};
		
		/**
		 * Event handler that should be attatched to the div 
		 * holding the navigation for a tab set.
		 *
		 * @param eventArgs e
		 * @return void
		 */
		bot.changeTab = function changeTab(e) {
			if (e.target !== e.currentTarget) {
				var i;
				var tabs = e.currentTarget.children;
				var tabContents = document.getElementById(e.currentTarget.getAttribute('tab-contents')).children;
				for (i = 0; i < tabs.length; i++) {
					tabs[i].removeAttribute('class');
					tabContents[i].removeAttribute('class');
				}
				e.target.className = 'selected';
				if (e.target.getAttribute('tab-name') !== null) {
					document.getElementById('mb_' + e.target.getAttribute('tab-name')).className = 'visible';
				}
			}
			e.stopPropagation();
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
			this.addMsg(containerElem, template, {});

			e.stopPropagation();
		};

		/**
		 * Method used to delete messages, calls the save config function if needed.
		 *
		 * @param eventArgs e
		 * @return void;
		 */
		bot.deleteMsg = function deleteMsg(e) {
			if (confirm("Really delete this message?")) {
				e.target.parentElement.outerHTML = '';
				this.saveConfig();
			}

			e.stopPropagation();
		};
	}
	
	//Store & extension control functions
	{
		/**
		 * Method used to add store items. Auto called by a request to the store.
		 * 
		 * @param object data 
		 * @return void
		 */
		bot.initStore = function initStore(data) {
			var content = document.getElementById('extTemplate').content;

			if (data.status == 'ok') {
				data.extensions.forEach((function (extension) {
					content.querySelector('h4').textContent = extension.title;
					content.querySelector('span').innerHTML = extension.snippet;
					content.querySelector('.ext').setAttribute('extension-id', extension.id);
					content.querySelector('button').textContent = this.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

					document.getElementById('exts').appendChild(document.importNode(content, true));
				}).bind(this));
			} else {
				document.getElementById('exts').innerHTML += 'Error: Unable to fetch data from the extension server.';
			}
			
			var sc = document.createElement('script');
			sc.crossOrigin = true;
			sc.src = '//blockheadsfans.com/messagebot/extensionnames.php?ids=' + this.extensions.join(',');
			document.body.appendChild(sc);
		};

		/**
		 * Method used to add an extension to the bot.
		 * 
		 * @param string extensionId the ID of the extension to load
		 * @return void
		 */
		bot.addExtension = function addExtension(extensionId) {
			var el = document.createElement('script');
			el.src = this.extensionURL + extensionId + '&w=' + window.worldId;
			el.crossOrigin = true;
			document.body.appendChild(el);
		};
		
		/** 
		 * Method used to add an extension manually, by ID or url. 
		 *
		 * @return void
		 */
		bot.manuallyAddExtension = function manuallyAddExtension() {
			var extRef = prompt('Enter the ID or URL of an extension');
			if (extRef !== null) {
				if (extRef.indexOf('http://') === 0) {
					var el = document.createElement('script');
					el.src = extRef;
					document.body.appendChild(el);
				} else {
					this.addExtension(extRef);
				}
			}
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

				this.removeTab('settings_' + extensionId);
				Object.keys(window[extensionId].mainTabs).forEach((function (key) {
					this.removeTab('main_' + extensionId + '_' + key);
				}).bind(this));
				//To make it simpler for devs to allow their extension to be added and removed without a page launch.
				window[extensionId] = undefined;
			}
			var extIn = this.extensions.indexOf(extensionId);
			if (extIn > -1) {
				this.extensions.splice(extIn, 1);
				this.saveConfig();
				var sc = document.createElement('script');
				sc.crossOrigin = true;
				sc.src = '//blockheadsfans.com/messagebot/extensionnames.php?ids=' + this.extensions.join(',');
				document.body.appendChild(sc);

				var button = document.querySelector('div[extension-id=' + extensionId + '] > button');
				if (button !== null) {
					button.textContent = 'Removed';
					setTimeout((function () {
						this.textContent = 'Install';
					}).bind(button), 3000);
				}
			}
		};
		
		/**
		 * Used to create and display a list of installed extensions that may not appear in the store.
		 */
		bot.extensionList = function extensionList(extensions) {
			var exts = JSON.parse(extensions),
				tempHTML = '<ul style="margin-left:1.5em;">';
			exts.forEach((function (ext) {
				tempHTML += '<li>' + this.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\')">Remove</a></li>';
			}).bind(this));
			tempHTML += '</ul>';

			document.getElementById('mb_ext_list').innerHTML = exts.length > 0 ? tempHTML : '<p>No extensions installed</p>';
		};
		
		/**
		 * Used to choose whether or not an extension will automatically launch the next time the bot loads.
		 *
		 * @param string exensionId the id of the extension
		 * @param boolean autoLaunch whether or not to launch the extension
		 * @return void
		 */
		bot.setAutoLaunch = function setAutoLaunch(extensionId, autoLaunch) {
			if (this.extensions.indexOf(extensionId) < 0 && autoLaunch) {
				this.extensions.push(extensionId);
				var sc = document.createElement('script');
				sc.crossOrigin = true;
				sc.src = '//blockheadsfans.com/messagebot/extensionnames.php?ids=' + this.extensions.join(',');
				document.body.appendChild(sc);
			} else if (!autoLaunch) {
				var extIn = this.extensions.indexOf(extensionId);
				if (extIn > -1) {
					this.extensions.splice(extIn, 1);
				}
			}
			this.saveConfig();
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
			extId = extId === null ? e.target.getAttribute('extension-id') : extId;
			if (e.target.tagName == 'BUTTON') {
				if (e.target.textContent == 'Install') {
					this.addExtension(extId);
					button.textContent = 'Remove';
				} else {
					this.removeExtension(extId);

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
			this.joinArr.forEach((function (msg) {
				if (this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {
					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', data.ip);
					this.core.send(toSend);
				}
			}).bind(this));
		};

		/**
		 * Function called whenever someone leaves the server.
		 * Should only be called by the core.
		 * 
		 * @param object data an object containing the name and ip of the player
		 */
		bot.onLeave = function onLeave(data) {
			this.leaveArr.forEach((function (msg) {
				if (this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {
					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', data.ip);
					this.core.send(toSend);
				}
			}).bind(this));
		};

		/**
		 * Function called whenever someone says something in chat.
		 * Should not be called except by the core
		 *
		 * @param object data an object containing the message and info on it
		 */
		bot.onTrigger = function onTrigger(data) {
			function triggerMatch(trigger, message) {
				if (this.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			}
			this.triggerArr.forEach((function (msg) {
				if (triggerMatch.call(this, msg.trigger, data.message) && this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {

					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', this.core.getIP(data.name));
					this.core.send(toSend);
				}
			}).bind(this));
		};

		/**
		 * Function called to send the next announcement, should only be called once.
		 *
		 * @param number ind the index of the announcement to send.
		 */
		bot.announcementCheck = function announcementCheck(ind) {
			var i = ind;
			if (ind == this.announcementArr.length) {
				i = 0;
			}
			if (typeof this.announcementArr[i] == 'object') {
				this.core.send(this.announcementArr[i].message);
			}
			setTimeout(this.announcementCheck.bind(this), this.preferences.announcementDelay * 60000, ++i);
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
			return this.replaceAll(this.replaceAll(html, '<', '&lt;'), '>', '&gt;');
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
			content.querySelector('div').id = 'm' + this.uMID;
			content.querySelector('.m').value = typeof saveObj.message == 'string' ? saveObj.message : '';
			if (template.id != 'aTemplate') {
				var numInputs = content.querySelectorAll('input[type="number"]');
				numInputs[0].value = typeof saveObj.joins_low == 'string' ? saveObj.joins_low : 0;
				numInputs[1].value = typeof saveObj.joins_high == 'string' ? saveObj.joins_high : 9999;
				if (template.id == 'tTemplate') {
					content.querySelector('.t').value = typeof saveObj.trigger == 'string' ? saveObj.trigger : '';
				}
			}
			//Groups done after appending or it doesn't work.
			container.appendChild(document.importNode(content, true));

			if (template.id != 'aTemplate') {
				var selects = document.querySelectorAll('#m' + this.uMID + ' > select');

				//Remove March 19th.
				var grp = typeof saveObj.group == 'string' ? saveObj.group : 'All';
				selects[0].value = (grp == 'Mods') ? 'Mod' : grp;

				selects[1].value = typeof saveObj.not_group == 'string' ? saveObj.not_group : 'Nobody';
			}
			document.querySelector('#m' + this.uMID + ' > a').addEventListener('click', this.deleteMsg.bind(this), false);

			this.uMID++;
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
				return this.core.adminList.indexOf(name) !== -1;
			}
			if (group == 'Mod') {
				return this.core.modList.indexOf(name) !== -1;
			}
			if (group == 'Staff') {
				return this.core.staffList.indexOf(name) !== -1;
			}
			if (group == 'Owner') {
				return this.core.ownerName == name;
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
	}
	
	//Setup function, used to write the config page and attatch event listeners.
	(function(bot) {
		function checkPref(target, type, name, defval) {
			if (typeof target.preferences[name] != type) {
				target.preferences[name] = defval;
			}
		}
		
		var str = localStorage.getItem('mb_preferences');
		bot.preferences = str === null ? {} : JSON.parse(str);
		checkPref(bot, 'boolean', 'showOnLaunch', false);
		checkPref(bot, 'number', 'announcementDelay', 10);
		checkPref(bot, 'boolean', 'regexTriggers', false);
		
		//Write the page...
		document.body.innerHTML += '<style>a{cursor:pointer}#botContainer{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff}#botHead{background-color:#051465;background-image:url(http://portal.theblockheads.net/static/images/portalHeader.png);min-height:52px;width:100%;height:80px;background-repeat:no-repeat}#botHead>nav{float:right;padding-top:52px;margin-right:5px}#botHead>nav>span{color:#FFF;list-style:outside none none;font-size:1.2em;padding:8px 5px}#botHead>nav>span.selected{background:#FFF;color:#182B73}#botTemplates{display:none}#botBody{overflow:auto;margin:5px}.botTabs{width:calc(100% - 5px);padding-left:5px;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-flow:row wrap;flex-flow:row wrap}.botTabs>div{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;-webkit-flex-grow:1;flex-grow:1;height:40px;margin-right:5px;margin-top:5px;min-width:120px;background:#182B73;color:#FFF;font-family:"Lucida Grande","Lucida Sans Unicode",sans-serif}.botTabs>div.selected{color:#000;background:#E7E7E7}#botTabs>div,#extTabs>div{position:relative;overflow-y:auto;background:#E7E7E7;padding:5px;height:calc(100% - 10px)}#botTabs,#extTabs{height:calc(100vh - 140px)}.tabContainer{width:calc(100% - 10px);margin-left:5px}.tabContainer>div{position:relative;display:none;width:calc(100% - 10px)}.tabContainer>div.visible{display:block;overflow:auto}span.descdet{margin-left:1em;max-width:calc(100% - 5em);display:inline-block}h3.descgen{margin-bottom:5px;width:calc(100% - 50px)}span.add{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:12px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.ext,.msg{width:calc(33% - 18.33px);min-width:310px;margin-left:5px;margin-top:5px;border:3px solid #878787;float:left;background:#B0B0B0;padding:5px}.msg>input{width:calc(100% - 10px)}.msg>input[type=number]{width:5em}.msg:nth-child(odd){background:#fff}.ann{display:block;width:100%;margin-top:5px}.ann>input{width:33%;min-width:300px;margin-right:5px}.ext:nth-child(odd){background:#E6E6E6}.ext{height:105px;position:relative}.ext>h4{margin:0}.ext>button{position:absolute;bottom:3px;left:3px;margin:1px;width:calc(50% - 2px);border:1px solid #000}#aMsgs,#exts,#jMsgs,#lMsgs,#tMsgs{border-top:1px solid #000;margin-top:10px}#settingsTabsNav>div{background:#182B73;color:#FFF}#settingsTabsNav>div.selected{background:#FFF;color:#000}#settingsTabs{background:#FFF}#settingsTabs>div{height:calc(100vh - 220px);padding:10px}div[tab-name]{font-size:110%;font-weight:700}</style> <div id="botContainer" style="display:none"> <div id="botHead"> <nav tab-contents="botBody"> <span id="botNav2">CONSOLE</span> <span class="selected" tab-name="messages">MESSAGES</span> <span tab-name="extensions">EXTENSIONS</span> </nav> </div> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <input class="m"> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <input class="m"> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Say:</label> <input class="m"> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button>Install</button> </div> </template> </div> <div class="tabContainer" id="botBody"> <div class="visible" id="mb_messages"> <nav class="botTabs" id="botMainNav" tab-contents="botTabs"> <div class="selected" tab-name="join">Join Messages</div> <div tab-name="leave">Leave Messages</div> <div tab-name="trigger">Trigger Messages</div> <div tab-name="announcements">Announcements</div> </nav> <div class="tabContainer" id="botTabs"> <div class="visible" id="mb_join"> <h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave"> <h3 class="descgen">These are checked when a player leaves the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger"> <h3 class="descgen">These are checked whenever someone says something.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements"> <h3 class="descgen">These are sent according to a regular schedule.</h3> <span class="descdet">If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X under the general settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> </div> </div> <div id="mb_extensions"> <nav class="botTabs" tab-contents="extTabs"> <div class="selected" tab-name="store">Store</div> <div tab-name="settings">Settings</div> </nav> <div class="tabContainer" id="extTabs"> <div class="visible" id="mb_store"> <h3 class="descgen">Extensions can improve the functionality of the bot.</h3> <span class="descdet">Interested in creating one? <a href="http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=306215#post306215" target="_blank">Click here.</a></span> <span id="mb_load_man" style="position:absolute;top:12px;right:12px;color:#fff;background:#182B73;padding:.5em">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings"> <nav class="botTabs" id="settingsTabsNav" tab-contents="settingsTabs"> <div class="selected" tab-name="general">General</div> </nav> <div class="tabContainer" id="settingsTabs"> <div class="visible" id="mb_general"> <h3>Settings</h3> <label for="mb_auto_show">Show bot on launch:</label> <input id="mb_auto_show" type="checkbox"><br> <label for="mb_ann_delay">Delay between announcements (minutes):</label> <input id="mb_ann_delay" type="number"><br> <label for="mb_regex_triggers">Parse triggers as RegEx (read the advanced use section <a href="http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=290924#post290924" target="_blank">here</a> first):</label> <input id="mb_regex_triggers" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> </div> </div> </div> <div id="mb_filler"></div> </div> </div>';
		document.getElementById('nav_worlds').outerHTML += '<li id="botNav"><a>Message Bot</a></li>';
		
		//Fix templates
		bot.fixTemplates();
		
		//Attatch event listeners...
		document.getElementById('botNav').addEventListener('click', bot.toggleBot, false);
		document.getElementById('botNav2').addEventListener('click', bot.toggleBot, false);

		document.querySelector('#botHead > nav').addEventListener('click', bot.changeTab, false);
		var tabNavs = document.querySelectorAll('nav.botTabs');
		
		var i;
		for (i = 0; i < tabNavs.length; i++) {
			tabNavs[i].addEventListener('click', bot.changeTab, false);
		}
		var addMsgElems = document.querySelectorAll('span.add');
		for (i = 0; i < addMsgElems.length; i++) {
			addMsgElems[i].addEventListener('click', bot.addEmptyMsg.bind(bot), false);
		}
		document.getElementById('jMsgs').addEventListener('change', bot.saveConfig.bind(bot), false);
		document.getElementById('lMsgs').addEventListener('change', bot.saveConfig.bind(bot), false);
		document.getElementById('tMsgs').addEventListener('change', bot.saveConfig.bind(bot), false);
		document.getElementById('aMsgs').addEventListener('change', bot.saveConfig.bind(bot), false);

		document.getElementById('exts').addEventListener('click', bot.extActions.bind(bot), false);
		document.getElementById('mb_load_man').addEventListener('click', bot.manuallyAddExtension.bind(bot), false);

		document.getElementById('mb_general').addEventListener('change', bot.savePrefs.bind(bot), false);

		//Backup / Load config
		document.getElementById('mb_backup_save').addEventListener('click', bot.backup.bind(bot), false);
		document.getElementById('mb_backup_load').addEventListener('click', bot.backup.bind(bot), false);

		//Handle preferences
		if (bot.preferences.showOnLaunch) {
			bot.toggleBot({ stopPropagation: function stopPropagation() {} });
			document.querySelector('#mb_auto_show').checked = 'checked';
		}
		document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
		document.querySelector('#mb_regex_triggers').checked = ((bot.preferences.regexTriggers) ? 'checked' : '');
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

		bot.extensions.forEach(function(ext) {
			var el = document.createElement('script');
			el.crossOrigin = true;
			el.src = bot.extensionURL + ext;
			document.head.appendChild(el);
		});

		bot.joinArr.forEach(function (msg) {
			bot.addMsg(document.getElementById('jMsgs'), document.getElementById('jlTemplate'), msg);
		});
		bot.leaveArr.forEach(function (msg) {
			bot.addMsg(document.getElementById('lMsgs'), document.getElementById('jlTemplate'), msg);
		});
		bot.triggerArr.forEach(function (msg) {
			bot.addMsg(document.getElementById('tMsgs'), document.getElementById('tTemplate'), msg);
		});
		bot.announcementArr.forEach(function (msg) {
			bot.addMsg(document.getElementById('aMsgs'), document.getElementById('aTemplate'), msg);
		});

		bot.saveConfig();
	}(bot));
	
	//Load the store... 
	(function () {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/store.php?callback=bot.initStore';
		sc.crossOrigin = true;
		document.head.appendChild(sc);
	})();
	
	return bot;
}
