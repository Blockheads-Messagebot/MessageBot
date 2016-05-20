'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*jshint
	browser:	true,
	devel:		true
*/
if (document.querySelector('script[crossorigin="true"]') === null) {
	alert('Your bookmark to launch the bot needs an update, redirecting you to the update page.');
	location.assign('http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=309090&viewfull=1#post309090');
}

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function () {};

/*jshint
	browser:	true,
	devel:		true,
	undef:		true,
	unused:		true,
	esversion: 6
*/
/*global
	ajaxJson
*/

function MessageBotCore() {
	//jshint ignore:line
	//Avoid trying to launch the bot on a non-console page.
	if (!document.getElementById('messageText')) {
		alert('Please start a server and navigate to the console page before starting the bot.');
		throw new Error("Not a console page. Opened at:" + document.location.href);
	}

	//For colored chat
	document.head.innerHTML += '<style>.admin > span:first-child { color: #0007CF} .mod > span:first-child { color: #08C738}</style>';
	//We are replacing these with our own functions.
	document.getElementById('messageButton').setAttribute('onclick', 'return bot.core.userSend(bot.core);');
	document.getElementById('messageText').setAttribute('onkeydown', 'bot.core.enterCheck(event, bot.core)');

	//fix setTimeout on IE 9
	(function () {
		if (document.all && !window.setTimeout.isPolyfill) {
			var __nativeST__ = window.setTimeout;
			window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
				var aArgs = Array.prototype.slice.call(arguments, 2);
				return __nativeST__(vCallback instanceof Function ? function () {
					vCallback.apply(null, aArgs);
				} : vCallback, nDelay);
			};
			window.setTimeout.isPolyfill = true;
		}
	})();

	//Defaults
	var core = {
		version: '5.1.0',
		ownerName: '',
		online: ['SERVER'],
		players: {},
		logs: [],
		listening: false,
		checkOnlineWait: 300000,
		sendDelay: 1000,
		joinFuncs: {},
		leaveFuncs: {},
		triggerFuncs: {},
		serverFuncs: {},
		otherFuncs: {},
		sendChecks: {},
		adminList: [],
		modList: [],
		staffList: [],
		toSend: [],
		chatMsgMaxCount: 500
	};

	core.worldName = document.title.substring(0, document.title.indexOf('Manager | Portal') - 1);
	core.chatId = window.chatId;

	//In regards to sending chat
	{
		/**
   * Adds a message to the queue to send when possible.
   *
   * @param string message the message to be checked and then sent.
   * @return void
   */
		core.send = function send(message) {
			core.toSend.push(message);
		};

		/**
   * Lets users send messages from the console, also ensures that commands are displayed and not eaten
   *
   * @param MessageBotCore core a reference to the core
   * @return void
   */
		core.userSend = function userSend(core) {
			var button = document.getElementById('messageButton');
			var message = document.getElementById('messageText');
			var tmpMsg = message.value;

			Object.keys(core.sendChecks).forEach(function (key) {
				if (tmpMsg) {
					tmpMsg = core.sendChecks[key](tmpMsg);
				}
			});

			if (tmpMsg) {
				button.setAttribute('disabled', '1');
				message.setAttribute('disabled', '1');
				button.textContent = 'SENDING';
				ajaxJson({ command: 'send', worldId: window.worldId, message: tmpMsg }, function (data) {
					if (data.status == 'ok') {
						message.value = '';
						button.textContent = 'SEND';
						core.pollChat(core, false);
					} else {
						button.textContent = 'RETRY';
					}

					button.removeAttribute('disabled');
					message.removeAttribute('disabled');
					message.focus();
				}, window.apiURL);
				if (tmpMsg.indexOf('/') === 0) {
					core.addMsgToPage({ name: 'SERVER', message: tmpMsg });
				}
			} else {
				button.textContent = 'CANCELED';
			}
		};

		/**
   * Preserves the enter = send functionality
   *
   * @param EventArgs EventArgs
   * @param MessageBotCore core
   */
		core.enterCheck = function enterCheck(event, core) {
			if (event.keyCode == 13) {
				if (event.preventDefault) {
					event.preventDefault();
				} else {
					event.returnValue = false;
				}
				core.userSend(core);
			}
		};
	}

	//Dealing with recieving chat
	{
		/*
   * Internal method. Use startListening and stopListening to control this function.
   *
   * @param MessageBotCore core a reference to the core.
   * @return void
   */
		core.pollChat = function pollChat(core) {
			var auto = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

			ajaxJson({ command: 'getchat', worldId: window.worldId, firstId: core.chatId }, function (data) {
				if (data.status == 'ok' && data.nextId != core.chatId) {
					data.log.forEach(function (m) {
						core.parseMessage(m);
					});
					if (auto) {
						setTimeout(core.pollChat, 5000, core);
					}
				} else if (data.status == 'error') {
					if (auto) {
						setTimeout(core.pollChat, core.checkOnlineWait, core);
					}
				}
				core.chatId = data.nextId;
			}, window.apiURL);
		};

		/**
   * Used to parse messages recieved from the server into objects which can be used. Also calls appropriate listeners.
   */
		core.parseMessage = function parseMessage(message) {
			var _this = this;

			var getUserName = function getUserName(message) {
				for (var i = 18; i > 4; i--) {
					var possibleName = message.substring(0, message.lastIndexOf(': ', i));
					if (_this.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
						return { name: possibleName, safe: true };
					}
				}
				//The user is not in our online list. Use the old substring method without checking that the user is online
				return { name: message.substring(0, message.lastIndexOf(': ', 18)), safe: false };
			};

			var name, ip;

			if (message.indexOf(this.worldName + ' - Player Connected ') === 0) {
				this.addMsgToPage(message);

				name = message.substring(this.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
				ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

				//Update player values
				if (this.players.hasOwnProperty(name)) {
					//Returning player
					this.players[name].joins++;
				} else {
					//New player
					this.players[name] = {};
					this.players[name].joins = 1;
					this.players[name].ips = [];
				}
				this.players[name].ip = ip;
				this.online.push(name);

				Object.keys(this.joinFuncs).forEach(function (key) {
					_this.joinFuncs[key]({ name: name, ip: ip });
				});
			} else if (message.indexOf(this.worldName + ' - Player Disconnected ') === 0) {
				this.addMsgToPage(message);

				name = message.substring(this.worldName.length + 23);
				ip = this.getIP(name);
				//Remove the user from the online list.
				var playerIn = this.online.indexOf(name);
				if (playerIn > -1) {
					this.online.splice(name, 1);
				}

				Object.keys(this.leaveFuncs).forEach(function (key) {
					_this.leaveFuncs[key]({ name: name, ip: ip });
				});
			} else if (message.indexOf(': ') >= 0) {
				//A chat message - server or player?
				var messageData = getUserName(message);
				messageData.message = message.substring(messageData.name.length + 2);
				this.addMsgToPage(messageData);
				//messageData resembles this:
				//	{name:"ABC123", message:"Hello there!", safe:true}

				if (messageData.name == 'SERVER') {
					//Server message
					Object.keys(this.serverFuncs).forEach(function (key) {
						_this.serverFuncs[key](messageData);
					});
				} else {
					//Regular player message
					Object.keys(this.triggerFuncs).forEach(function (key) {
						_this.triggerFuncs[key](messageData);
					});
				}
			} else {
				this.addMsgToPage(message);
				Object.keys(this.otherFuncs).forEach(function (key) {
					_this.otherFuncs[key](message);
				});
			}
		};
	}

	//Dealing with the UI
	{
		/*
   * Adds a message to the console, expects this to be assigned to the core
   *
   * @param string|object Either an object with properties name and message, or a string
   * @return void
   */
		core.addMsgToPage = function addMsgToPage(msg) {
			var html = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

			var elclass = '';
			var chatEl = document.getElementById('chatBox');

			var contEl = document.createElement('tr');
			var msgEl = document.createElement('td');
			contEl.appendChild(msgEl);

			if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) == 'object') {
				if (this.staffList.indexOf(msg.name) > -1) {
					elclass = this.adminList.indexOf(msg.name) > -1 ? 'admin' : 'mod';
					msgEl.setAttribute('class', elclass);
				}
				var nameEl = document.createElement('span');
				nameEl.textContent = msg.name;
				msgEl.appendChild(nameEl);

				var msgElIn = document.createElement('span');
				msgElIn.textContent = ': ' + msg.message;
				msgEl.appendChild(msgElIn);
			} else {
				if (html) {
					msgEl.innerHTML = msg;
				} else {
					msgEl.textContent = msg;
				}
			}
			var chat = document.querySelector('#chat > tbody');
			var position = chatEl.scrollHeight - chatEl.scrollTop;
			chat.appendChild(contEl);

			if (position <= 310) {
				chatEl.scrollTop = chatEl.scrollHeight;
			}

			while (chat.children.length > this.chatMsgMaxCount) {
				chat.removeChild(chat.childNodes[0]);
			}
		};
	}

	//Dealing with player data
	{
		/**
   * Gets the most recently used IP for a player by name and returns it
   * @param string name the name of the player
   * @return string|bool the most recently used IP or false on failure
   */
		core.getIP = function getIP(name) {
			if (this.players.hasOwnProperty(name)) {
				return this.players[name].ip;
			}
			return false;
		};

		/**
   * Gets the number of times a player has joined the server
   *
   * @param string name the name of the player
   * @return int|bool the number of joins, or false if the player has not joined the server
   */
		core.getJoins = function getJoins(name) {
			if (this.players.hasOwnProperty(name)) {
				return this.players[name].joins;
			}
			return false;
		};
	}

	//Controlling the core
	{
		/**
   * Method used to tell the bot to start listening to chat
   *
   * @return void
   */
		core.startListening = function startListening() {
			this.chatId = window.chatId;
			this.pollChat(this);
			this.listening = true;
		};
	}

	//Chat listening control
	{
		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addJoinListener = function addJoinListener(uniqueId, listener) {
			if (!this.joinFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.joinFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on join messages by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeJoinListener = function removeJoinListener(uniqueId) {
			delete this.joinFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used
   */
		core.addLeaveListener = function addLeaveListener(uniqueId, listener) {
			if (!this.leaveFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.leaveFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on leave messages by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeLeaveListener = function removeLeaveListener(uniqueId) {
			delete this.leaveFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addTriggerListener = function addTriggerListener(uniqueId, listener) {
			if (!this.triggerFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.triggerFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on trigger messages by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeTriggerListener = function removeTriggerListener(uniqueId) {
			delete this.joinFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addServerListener = function addServerListener(uniqueId, listener) {
			if (!this.serverFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.serverFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on server messages by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeServerListener = function removeServerListener(uniqueId) {
			delete this.serverFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addOtherListener = function addOtherListener(uniqueId, listener) {
			if (!this.otherFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.otherFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on trigger messages by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeOtherListener = function removeOtherListener(uniqueId) {
			delete this.otherFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
			if (!this.sendChecks.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.sendChecks[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		/**
   * Removes the listener on checks before sending by the id
   *
   * @param string uniqueId the id of the listener
   * @return void
   */
		core.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
			delete this.sendChecks[uniqueId];
		};
	}

	//Get the player list
	(function (core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			core.logs = xhr.responseText.split('\n');
			xhr.responseText.split('\n').forEach(function (line) {
				if (line.indexOf(core.worldName + ' - Player Connected ') > -1) {
					var player = line.substring(line.indexOf(' - Player Connected ') + 20, line.lastIndexOf('|', line.lastIndexOf('|') - 1) - 1);
					var ip = line.substring(line.lastIndexOf(' | ', line.lastIndexOf(' | ') - 1) + 3, line.lastIndexOf(' | '));

					if (core.players.hasOwnProperty(player)) {
						core.players[player].joins++;
					} else {
						core.players[player] = {};
						core.players[player].ips = [];
						core.players[player].joins = 1;
					}
					core.players[player].ip = ip;
					if (core.players[player].ips.indexOf(ip) < 0) {
						core.players[player].ips.push(ip);
					}
				}
			});
		};
		xhr.open('GET', 'http://portal.theblockheads.net/worlds/logs/' + window.worldId, true);
		xhr.send();
	})(core);

	//Get staff lists
	(function (core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
			core.adminList = doc.querySelector('textarea[name=admins]').value.split('\n');
			core.adminList.push(core.ownerName);
			core.adminList.push('SERVER');
			core.adminList.forEach(function (admin, index) {
				core.adminList[index] = admin.toUpperCase();
			});
			var mList = doc.querySelector('textarea[name=modlist]').value.split('\n');
			mList.forEach(function (mod, index) {
				mList[index] = mod.toUpperCase();
			});
			core.modList = mList.filter(function (mod) {
				return core.adminList.indexOf(mod) < 0;
			});

			core.staffList = core.adminList.concat(core.modList);
		};
		xhr.open('GET', 'http://portal.theblockheads.net/worlds/lists/' + window.worldId, true);
		xhr.send();
	})(core);

	//Get online players
	(function (core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
			core.ownerName = doc.querySelector('.subheader~tr>td:not([class])').textContent;
			var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
			var playerElemsCount = playerElems.length;
			for (var i = 0; i < playerElemsCount; i++) {
				if (core.online.indexOf(playerElems[i].textContent) < 0) {
					core.online.push(playerElems[i].textContent);
				}
			}
		};
		xhr.open('GET', 'http://portal.theblockheads.net/worlds/' + window.worldId, true);
		xhr.send();
	})(core);

	//Start listening for messages to send
	core.postMessage = function postMessage() {
		var _this2 = this;

		if (this.toSend.length > 0) {
			var tmpMsg = this.toSend.shift();
			Object.keys(this.sendChecks).forEach(function (key) {
				if (tmpMsg) {
					tmpMsg = _this2.sendChecks[key](tmpMsg);
				}
			});
			if (tmpMsg) {
				ajaxJson({ command: 'send', worldId: window.worldId, message: tmpMsg }, undefined, window.apiURL);
			}
		}
		setTimeout(this.postMessage.bind(this), this.sendDelay);
	};
	core.postMessage();

	//Start listening for admin / mod changes
	core.staffChangeCheck = function staffChangeCheck(data) {
		var _this3 = this;

		var rebuildStaffList = function rebuildStaffList() {
			_this3.staffList = _this3.adminList.concat(_this3.modList);
		};
		var messageData = typeof data == 'string' ? { name: 'SERVER', message: data } : data;
		if (this.adminList.indexOf(messageData.name) != -1) {
			var targetName;
			switch (messageData.message.toLocaleUpperCase().substring(0, messageData.message.indexOf(' '))) {
				case '/ADMIN':
					targetName = messageData.message.toLocaleUpperCase().substring(7);
					if (this.adminList.indexOf(targetName) < 0) {
						this.adminList.push(targetName);
						rebuildStaffList();
					}
					break;
				case '/UNADMIN':
					targetName = messageData.message.toLocaleUpperCase().substring(10);
					if (this.adminList.indexOf(targetName) != -1) {
						this.modList.splice(this.adminList.indexOf(targetName), 1);
						rebuildStaffList();
					}
					break;
				case '/MOD':
					targetName = messageData.message.toLocaleUpperCase().substring(5);
					if (this.modList.indexOf(targetName) < 0) {
						this.modList.push(targetName);
						rebuildStaffList();
					}
					break;
				case '/UNMOD':
					targetName = messageData.message.toLocaleUpperCase().substring(7);
					if (this.modList.indexOf(targetName) != -1) {
						this.modList.splice(this.modList.indexOf(targetName), 1);
						rebuildStaffList();
					}
			}
		}
		return data;
	};
	core.addServerListener('core_staffChanges', core.staffChangeCheck.bind(core));
	core.addTriggerListener('core_staffChanges', core.staffChangeCheck.bind(core));

	return core;
}

/*jshint
	esnext:		true,
	browser:	true,
	devel:		true,
	unused:		strict,
	undef:		true
*/
/*global
	MessageBotCore
*/

function MessageBot() {
	//jshint ignore:line
	var bot = {
		devMode: false,
		core: MessageBotCore(),
		uMID: 0,
		version: '5.1.0',
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
			var _this4 = this;

			var utilSaveFunc = function utilSaveFunc(wrapper, saveTo) {
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
						if (_this4.preferences.disableTrim) {
							tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
						} else {
							tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();
						}
					}
					saveTo.push(tmpMsgObj);
					tmpMsgObj = {};
				}
			};

			this.joinArr = [];
			this.leaveArr = [];
			this.triggerArr = [];
			this.announcementArr = [];
			utilSaveFunc(document.getElementById('lMsgs'), this.leaveArr);
			utilSaveFunc(document.getElementById('jMsgs'), this.joinArr);
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

			var code = prompt('Enter the backup code:');

			try {
				code = JSON.parse(code);
			} catch (e) {
				alert('Invalid backup. No action taken.');
				return;
			}

			if (code !== null) {
				localStorage.clear();
				Object.keys(code).forEach(function (key) {
					localStorage.setItem(key, code[key]);
				});

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
			prefs.disableTrim = document.querySelector('#mb_disable_trim').checked;
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
			var _this5 = this;

			var content = document.getElementById('extTemplate').content;

			if (data.status == 'ok') {
				data.extensions.forEach(function (extension) {
					content.querySelector('h4').textContent = extension.title;
					content.querySelector('span').innerHTML = extension.snippet;
					content.querySelector('.ext').setAttribute('extension-id', extension.id);
					content.querySelector('button').textContent = _this5.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

					document.getElementById('exts').appendChild(document.importNode(content, true));
				});
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
			var _this6 = this;

			if (typeof window[extensionId] != 'undefined') {
				if (typeof window[extensionId].uninstall == 'function') {
					window[extensionId].uninstall();
				}

				this.removeTab('settings_' + extensionId);
				Object.keys(window[extensionId].mainTabs).forEach(function (key) {
					_this6.removeTab('main_' + extensionId + '_' + key);
				});
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
					setTimeout(function () {
						this.textContent = 'Install';
					}.bind(button), 3000);
				}
			}
		};

		/**
   * Used to create and display a list of installed extensions that may not appear in the store.
   */
		bot.extensionList = function extensionList(extensions) {
			var _this7 = this;

			var exts = JSON.parse(extensions),
			    tempHTML = '<ul style="margin-left:1.5em;">';
			exts.forEach(function (ext) {
				tempHTML += '<li>' + _this7.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\')">Remove</a></li>';
			});
			tempHTML += '</ul>';

			document.getElementById('mb_ext_list').innerHTML = exts.length ? tempHTML : '<p>No extensions installed</p>';
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
			extId = extId || e.target.getAttribute('extension-id');
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
			var _this8 = this;

			this.joinArr.forEach(function (msg) {
				if (_this8.checkGroup(msg.group, data.name) && !_this8.checkGroup(msg.not_group, data.name) && _this8.checkJoins(msg.joins_low, msg.joins_high, _this8.core.getJoins(data.name))) {
					var toSend = _this8.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this8.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this8.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this8.replaceAll(toSend, '{{ip}}', data.ip);
					_this8.core.send(toSend);
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
			var _this9 = this;

			this.leaveArr.forEach(function (msg) {
				if (_this9.checkGroup(msg.group, data.name) && !_this9.checkGroup(msg.not_group, data.name) && _this9.checkJoins(msg.joins_low, msg.joins_high, _this9.core.getJoins(data.name))) {
					var toSend = _this9.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this9.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this9.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this9.replaceAll(toSend, '{{ip}}', data.ip);
					_this9.core.send(toSend);
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
			var _this10 = this;

			var triggerMatch = function triggerMatch(trigger, message) {
				if (_this10.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			};
			this.triggerArr.forEach(function (msg) {
				if (triggerMatch(msg.trigger, data.message) && _this10.checkGroup(msg.group, data.name) && !_this10.checkGroup(msg.not_group, data.name) && _this10.checkJoins(msg.joins_low, msg.joins_high, _this10.core.getJoins(data.name))) {

					var toSend = _this10.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this10.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this10.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this10.replaceAll(toSend, '{{ip}}', _this10.core.getIP(data.name));
					_this10.core.send(toSend);
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
			if (ind == this.announcementArr.length) {
				i = 0;
			}
			if (_typeof(this.announcementArr[i]) == 'object') {
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
			content.querySelector('.m').value = saveObj.message || '';
			if (template.id != 'aTemplate') {
				var numInputs = content.querySelectorAll('input[type="number"]');
				numInputs[0].value = saveObj.joins_low || 0;
				numInputs[1].value = saveObj.joins_high || 9999;
				if (template.id == 'tTemplate') {
					if (saveObj.trigger) {
						saveObj.trigger = this.preferences.disableTrim ? saveObj.trigger : saveObj.trigger.trim();
					}
					content.querySelector('.t').value = saveObj.trigger || '';
				}
			}
			//Groups done after appending or it doesn't work.
			container.appendChild(document.importNode(content, true));

			if (template.id != 'aTemplate') {
				var selects = document.querySelectorAll('#m' + this.uMID + ' > select');

				selects[0].value = saveObj.group || 'All';

				selects[1].value = saveObj.not_group || 'Nobody';
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

		/**
   * Can be used to check if an extension is compatable as API changes are only made on minor versions
   * Accepts a version string like 5.1.* or >5.1.0 or <5.1.0
   *
   * @param string target the target version pattern
   * @return bool
   */
		bot.versionCheck = function versionCheck(target) {
			var vArr = this.version.split('.');
			var tArr = target.replace(/[^0-9.*]/g, '').split('.');
			if (/^[0-9.*]+$/.test(target)) {
				return tArr.every(function (el, i) {
					return el == vArr[i] || el == '*';
				});
			} else if (/^>[0-9.]+$/.test(target)) {
				for (var i = 0; i < tArr.length; i++) {
					if (Number(vArr[i]) > Number(tArr[i])) {
						return true;
					}
				}
				return false;
			} else if (/^<[0-9.]+$/.test(target)) {
				for (var _i = 0; _i < tArr.length; _i++) {
					if (Number(vArr[_i]) > Number(tArr[_i])) {
						return true;
					}
				}
				return false;
			}
			return false;
		};
	}

	//Setup function, used to write the config page and attatch event listeners.
	(function (bot) {
		function checkPref(target, type, name, defval) {
			if (_typeof(target.preferences[name]) != type) {
				target.preferences[name] = defval;
			}
		}

		var str = localStorage.getItem('mb_preferences');
		bot.preferences = str === null ? {} : JSON.parse(str);
		checkPref(bot, 'boolean', 'showOnLaunch', false);
		checkPref(bot, 'number', 'announcementDelay', 10);
		checkPref(bot, 'boolean', 'regexTriggers', false);
		checkPref(bot, 'boolean', 'disableTrim', false);

		//Write the page...
		document.head.innerHTML += '<style>{{inject ../dist/tmpbot.css}}<style>';
		document.body.innerHTML += '{{inject ../dist/tmpbot.html}}';
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
		document.querySelector('#mb_regex_triggers').checked = bot.preferences.regexTriggers ? 'checked' : '';
		document.querySelector('#mb_disable_trim').checked = bot.preferences.disableTrim ? 'checked' : '';
	})(bot);

	//Load the saved config, including extensions
	(function (bot) {
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

		bot.extensions.forEach(function (ext) {
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
	})(bot);

	//Load the store...
	(function () {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/store.php?callback=bot.initStore';
		sc.crossOrigin = true;
		document.head.appendChild(sc);
	})();

	return bot;
}

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

/*jshint
	browser: true,
	undef: true
*/
/*global
	MessageBot
*/
var bot = {};

window.onerror = function (text, file, line, column) {
	if (!bot.devMode && text != 'Script error.') {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?version= ' + bot.version + '&wId=' + encodeURIComponent(window.worldId) + '&wName=' + encodeURIComponent(bot.core.worldName) + '&text=' + encodeURIComponent(text) + '&file=' + encodeURIComponent(file) + '&line=' + line + '&col=' + (column || 0); //IE 9 won't pass column number
		document.head.appendChild(sc);
	}
};

bot = MessageBot();
bot.start();

//Tracking launches.
(function () {
	var s = document.createElement('script');
	s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(bot.core.ownerName) + '&id=' + window.worldId + '&world=' + encodeURIComponent(bot.core.worldName);
	document.head.appendChild(s);
})();