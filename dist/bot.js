'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

if (document.querySelector('script[crossorigin="true"]') === null) {
	alert('Your bookmark to launch the bot needs an update, redirecting you to the update page.');
	location.assign('http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=309090&viewfull=1#post309090');
}

window.pollChat = function () {};

function MessageBotCore() {
	if (!document.getElementById('messageText')) {
		alert('Please start a server and navigate to the console page before starting the bot.');
	}

	document.styleSheets[0].insertRule('.admin > span:first-child { color: #0007CF}', 0);
	document.styleSheets[0].insertRule('.mod > span:first-child { color: #08C738}', 0);
	document.getElementById('messageButton').setAttribute('onclick', 'return bot.core.userSend(bot.core);');
	document.getElementById('messageText').setAttribute('onkeydown', 'bot.core.enterCheck(event, bot.core)');

	(function () {
		if (document.all && !window.setTimeout.isPolyfill) {
			var __nativeST__ = window.setTimeout;
			window.setTimeout = function (vCallback, nDelay) {
				var aArgs = Array.prototype.slice.call(arguments, 2);
				return __nativeST__(vCallback instanceof Function ? function () {
					vCallback.apply(null, aArgs);
				} : vCallback, nDelay);
			};
			window.setTimeout.isPolyfill = true;
		}
	})();

	var core = {
		version: '5.1.0',
		online: ['SERVER'],
		players: {},
		logs: [],
		listening: false,
		_shouldListen: false,
		checkOnlineWait: 60000 * 5,
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
	core.ownerName = document.getElementById('nav_profile').textContent;
	core.chatId = window.chatId;

	{
		core.send = function send(message) {
			core.toSend.push(message);
		};

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

		core.enterCheck = function enterCheck(e, t) {
			if (e.keyCode == 13) {
				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
				t.userSend(t);
			}
		};
	}

	{
		core.pollChat = function pollChat(core) {
			ajaxJson({ command: 'getchat', worldId: window.worldId, firstId: core.chatId }, function (data) {
				if (data.status == 'ok' && data.nextId != core.chatId) {
					data.log.forEach(function (m) {
						core.parseMessage(m);
					});
				} else if (data.status == 'error') {
					core._shouldListen = false;
					setTimeout(core.checkOnline, core.checkOnlineWait, core);
				}
				if (core._shouldListen) {
					setTimeout(core.pollChat, 5000, core);
				} else {
					core.listening = false;
				}
				core.chatId = data.nextId;
			}, window.apiURL);
		};

		core.checkOnline = function checkOnline(core) {
			ajaxJson({ command: 'status', worldId: window.worldId }, function (data) {
				if (data.worldStatus == 'online') {
					core.startListening();
				} else {
					setTimeout(core.checkOnline, core.checkOnlineWait, core);
				}
			}, window.apiURL);
		};

		core.parseMessage = function parseMessage(message) {
			function getUserName(message, core) {
				for (var i = 18; i > 4; i--) {
					var possibleName = message.substring(0, message.lastIndexOf(': ', i));
					if (core.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
						return { name: possibleName, safe: true };
					}
				}
				return { name: message.substring(0, message.lastIndexOf(': ', 18)), safe: false };
			}
			function rebuildStaffList(core) {
				core.staffList = core.adminList.concat(core.modList);
			}

			var name, ip;
			if (message.indexOf(this.worldName + ' - Player Connected ') === 0) {
				this.addMsgToPage(message);

				name = message.substring(this.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
				ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

				if (this.players.hasOwnProperty(name)) {
					this.players[name].joins++;
				} else {
					this.players[name] = {};
					this.players[name].joins = 1;
					this.players[name].ips = [];
				}
				this.players[name].ip = ip;
				this.online.push(name);

				Object.keys(this.joinFuncs).forEach(function (key) {
					this.joinFuncs[key]({ name: name, ip: ip });
				}.bind(this));
			} else if (message.indexOf(this.worldName + ' - Player Disconnected ') === 0) {
				this.addMsgToPage(message);

				name = message.substring(this.worldName.length + 23);
				ip = this.getIP(name);
				var playerIn = this.online.indexOf(name);
				if (playerIn > -1) {
					this.online.splice(name, 1);
				}

				Object.keys(this.leaveFuncs).forEach(function (key) {
					this.leaveFuncs[key]({ name: name, ip: ip });
				}.bind(this));
			} else if (message.indexOf(': ') >= 0) {
				var messageData = getUserName(message, this);
				messageData.message = message.substring(messageData.name.length + 2);
				this.addMsgToPage(messageData);

				if (this.adminList.indexOf(messageData.name) != -1) {
					var targetName;
					switch (messageData.message.toLocaleUpperCase().substring(0, messageData.message.indexOf(' '))) {
						case '/ADMIN':
							targetName = messageData.message.toLocaleUpperCase().substring(7);
							if (this.adminList.indexOf(targetName) < 0) {
								this.adminList.push(targetName);
								rebuildStaffList(this);
							}
							break;
						case '/UNADMIN':
							targetName = messageData.message.toLocaleUpperCase().substring(10);
							if (this.adminList.indexOf(targetName) != -1) {
								this.modList.splice(this.adminList.indexOf(targetName), 1);
								rebuildStaffList(this);
							}
							break;
						case '/MOD':
							targetName = messageData.message.toLocaleUpperCase().substring(5);
							if (this.modList.indexOf(targetName) < 0) {
								this.modList.push(targetName);
								rebuildStaffList(this);
							}
							break;
						case '/UNMOD':
							targetName = messageData.message.toLocaleUpperCase().substring(7);
							if (this.modList.indexOf(targetName) != -1) {
								this.modList.splice(this.modList.indexOf(targetName), 1);
								rebuildStaffList(this);
							}
					}
				}

				if (messageData.name == 'SERVER') {
					Object.keys(this.serverFuncs).forEach(function (key) {
						this.serverFuncs[key](messageData);
					}.bind(this));
				} else {
					Object.keys(this.triggerFuncs).forEach(function (key) {
						this.triggerFuncs[key](messageData);
					}.bind(this));
				}
			} else {
				this.addMsgToPage(message);
				Object.keys(this.otherFuncs).forEach(function (key) {
					this.otherFuncs[key](message);
				}.bind(this));
			}
		};
	}

	{
		core.addMsgToPage = function addMsgToPage(msg) {
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
				msgEl.textContent = msg;
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

	{
		core.getIP = function getIP(name) {
			if (this.players.hasOwnProperty(name)) {
				return this.players[name].ip;
			}
			return false;
		};

		core.getJoins = function getJoins(name) {
			if (this.players.hasOwnProperty(name)) {
				return this.players[name].joins;
			}
			return false;
		};
	}

	{
		core.startListening = function startListening() {
			this.chatId = window.chatId;
			this.pollChat(this);
			this.listening = true;
			this._shouldListen = true;
		};

		core.stopListening = function stopListening() {
			this._shouldListen = false;
		};
	}

	{
		core.addJoinListener = function addJoinListener(uniqueId, listener) {
			if (!this.joinFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.joinFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeJoinListener = function removeJoinListener(uniqueId) {
			delete this.joinFuncs[uniqueId];
		};

		core.addLeaveListener = function addLeaveListener(uniqueId, listener) {
			if (!this.leaveFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.leaveFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeLeaveListener = function removeLeaveListener(uniqueId) {
			delete this.leaveFuncs[uniqueId];
		};

		core.addTriggerListener = function addTriggerListener(uniqueId, listener) {
			if (!this.triggerFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.triggerFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeTriggerListener = function removeTriggerListener(uniqueId) {
			delete this.joinFuncs[uniqueId];
		};

		core.addServerListener = function addServerListener(uniqueId, listener) {
			if (!this.serverFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.serverFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeServerListener = function removeServerListener(uniqueId) {
			delete this.serverFuncs[uniqueId];
		};

		core.addOtherListener = function addOtherListener(uniqueId, listener) {
			if (!this.otherFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.otherFuncs[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeOtherListener = function removeOtherListener(uniqueId) {
			delete this.otherFuncs[uniqueId];
		};

		core.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
			if (!this.sendChecks.hasOwnProperty(uniqueId) && typeof listener == "function") {
				this.sendChecks[uniqueId] = listener;
				return true;
			} else {
				return false;
			}
		};

		core.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
			delete this.sendChecks[uniqueId];
		};
	}

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

	(function (core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
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

	core.postMessageReference = setInterval(function postMessage() {
		if (this.toSend.length > 0) {
			var tmpMsg = this.toSend.shift();
			Object.keys(this.sendChecks).forEach(function (key) {
				if (tmpMsg) {
					tmpMsg = this.sendChecks[key](tmpMsg);
				}
			}.bind(this));
			if (tmpMsg) {
				ajaxJson({ command: 'send', worldId: window.worldId, message: tmpMsg }, undefined, window.apiURL);
			}
		}
	}.bind(core), 1000);

	return core;
}

function MessageBot() {
	var bot = {
		devMode: false,
		core: MessageBotCore(),
		uMID: 0,
		version: '5.1.0',
		extensions: [],
		preferences: {},
		extensionURL: '//blockheadsfans.com/messagebot/extension.php?id='
	};

	{
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
				}.bind(this));

				alert('Backup loaded. Please restart the bot.');
				location.reload(true);
			}
		};

		bot.savePrefs = function savePrefs() {
			var prefs = {};
			prefs.showOnLaunch = document.querySelector('#mb_auto_show').checked;
			prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
			prefs.regexTriggers = document.querySelector('#mb_regex_triggers').checked;
			this.preferences = prefs;
			localStorage.setItem('mb_preferences', JSON.stringify(prefs));
		};
	}

	{
		bot.start = function start() {
			this.core.addJoinListener('mb_join', this.onJoin.bind(this));
			this.core.addLeaveListener('mb_leave', this.onLeave.bind(this));
			this.core.addTriggerListener('mb_trigger', this.onTrigger.bind(this));
			this.announcementCheck(0);
			this.core.startListening();
		};

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

		bot.removeTab = function removeTab(tabName) {
			if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
				document.querySelector('div[tab-name="' + tabName + '"]').outerHTML = '';
				document.querySelector('#mb_' + tabName).outerHTML = '';
				return true;
			}
			return false;
		};

		bot.addSettingsTab = function addSettingsTab(tabName, tabText) {
			return this.addTab('settingsTabsNav', 'settingsTabs', tabName, tabText);
		};

		bot.addMainTab = function addMainTab(tabName, tabText) {
			return this.addTab('botMainNav', 'botTabs', tabName, tabText);
		};

		bot.toggleBot = function toggleBot(e) {
			var el = document.getElementById('botContainer');
			if (el.style.display !== 'none') {
				el.style.display = 'none';
			} else {
				el.style.display = 'block';
			}
			e.stopPropagation();
		};

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

	{
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

		bot.deleteMsg = function deleteMsg(e) {
			if (confirm("Really delete this message?")) {
				e.target.parentElement.outerHTML = '';
				this.saveConfig();
			}

			e.stopPropagation();
		};
	}

	{
		bot.initStore = function initStore(data) {
			var content = document.getElementById('extTemplate').content;

			if (data.status == 'ok') {
				data.extensions.forEach(function (extension) {
					content.querySelector('h4').textContent = extension.title;
					content.querySelector('span').innerHTML = extension.snippet;
					content.querySelector('.ext').setAttribute('extension-id', extension.id);
					content.querySelector('button').textContent = this.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

					document.getElementById('exts').appendChild(document.importNode(content, true));
				}.bind(this));
			} else {
				document.getElementById('exts').innerHTML += 'Error: Unable to fetch data from the extension server.';
			}

			var sc = document.createElement('script');
			sc.crossOrigin = true;
			sc.src = '//blockheadsfans.com/messagebot/extensionnames.php?ids=' + this.extensions.join(',');
			document.body.appendChild(sc);
		};

		bot.addExtension = function addExtension(extensionId) {
			var el = document.createElement('script');
			el.src = this.extensionURL + extensionId + '&w=' + window.worldId;
			el.crossOrigin = true;
			document.body.appendChild(el);
		};

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

		bot.removeExtension = function removeExtension(extensionId) {
			if (typeof window[extensionId] != 'undefined') {
				if (typeof window[extensionId].uninstall == 'function') {
					window[extensionId].uninstall();
				}

				this.removeTab('settings_' + extensionId);
				Object.keys(window[extensionId].mainTabs).forEach(function (key) {
					this.removeTab('main_' + extensionId + '_' + key);
				}.bind(this));
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

		bot.extensionList = function extensionList(extensions) {
			var exts = JSON.parse(extensions),
			    tempHTML = '<ul style="margin-left:1.5em;">';
			exts.forEach(function (ext) {
				tempHTML += '<li>' + this.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\')">Remove</a></li>';
			}.bind(this));
			tempHTML += '</ul>';

			document.getElementById('mb_ext_list').innerHTML = exts.length > 0 ? tempHTML : '<p>No extensions installed</p>';
		};

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

		bot.extActions = function extActions(e) {
			var extId = e.target.parentElement.getAttribute('extension-id');
			var button = document.querySelector('div[extension-id="' + extId + '"] > button');
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

	{
		bot.onJoin = function onJoin(data) {
			this.joinArr.forEach(function (msg) {
				if (this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {
					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', data.ip);
					this.core.send(toSend);
				}
			}.bind(this));
		};

		bot.onLeave = function onLeave(data) {
			this.leaveArr.forEach(function (msg) {
				if (this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {
					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', data.ip);
					this.core.send(toSend);
				}
			}.bind(this));
		};

		bot.onTrigger = function onTrigger(data) {
			function triggerMatch(trigger, message) {
				if (this.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			}
			this.triggerArr.forEach(function (msg) {
				if (triggerMatch.call(this, msg.trigger, data.message) && this.checkGroup(msg.group, data.name) && !this.checkGroup(msg.not_group, data.name) && this.checkJoins(msg.joins_low, msg.joins_high, this.core.getJoins(data.name))) {

					var toSend = this.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = this.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = this.replaceAll(toSend, '{{ip}}', this.core.getIP(data.name));
					this.core.send(toSend);
				}
			}.bind(this));
		};

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

	{
		bot.stripHTML = function stripHTML(html) {
			return this.replaceAll(this.replaceAll(html, '<', '&lt;'), '>', '&gt;');
		};

		bot.replaceAll = function replaceAll(string, find, replace) {
			return string.replace(new RegExp(find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), replace);
		};

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
			container.appendChild(document.importNode(content, true));

			if (template.id != 'aTemplate') {
				var selects = document.querySelectorAll('#m' + this.uMID + ' > select');

				var grp = typeof saveObj.group == 'string' ? saveObj.group : 'All';
				selects[0].value = grp == 'Mods' ? 'Mod' : grp;

				selects[1].value = typeof saveObj.not_group == 'string' ? saveObj.not_group : 'Nobody';
			}
			document.querySelector('#m' + this.uMID + ' > a').addEventListener('click', this.deleteMsg.bind(this), false);

			this.uMID++;
		};

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

		bot.checkJoins = function checkJoins(low, high, actual) {
			return low <= actual && actual <= high;
		};

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

		document.body.innerHTML += '<style>a{cursor:pointer}#botContainer{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff}#botHead{background-color:#051465;background-image:url(http://portal.theblockheads.net/static/images/portalHeader.png);min-height:52px;width:100%;height:80px;background-repeat:no-repeat}#botHead>nav{float:right;padding-top:52px;margin-right:5px}#botHead>nav>span{color:#FFF;list-style:outside none none;font-size:1.2em;padding:8px 5px}#botHead>nav>span.selected{background:#FFF;color:#182B73}#botTemplates{display:none}#botBody{overflow:auto;margin:5px}.botTabs{width:calc(100% - 5px);padding-left:5px;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-flow:row wrap;flex-flow:row wrap}.botTabs>div{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;-webkit-flex-grow:1;flex-grow:1;height:40px;margin-right:5px;margin-top:5px;min-width:120px;background:#182B73;color:#FFF;font-family:"Lucida Grande","Lucida Sans Unicode",sans-serif}.botTabs>div.selected{color:#000;background:#E7E7E7}#botTabs>div,#extTabs>div{position:relative;overflow-y:auto;background:#E7E7E7;padding:5px;height:calc(100% - 10px)}#botTabs,#extTabs{height:calc(100vh - 140px)}.tabContainer{width:calc(100% - 10px);margin-left:5px}.tabContainer>div{position:relative;display:none;width:calc(100% - 10px)}.tabContainer>div.visible{display:block;overflow:auto}span.descdet{margin-left:1em;max-width:calc(100% - 5em);display:inline-block}h3.descgen{margin-bottom:5px;width:calc(100% - 50px)}span.add{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:12px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.ext,.msg{width:calc(33% - 18.33px);min-width:310px;margin-left:5px;margin-top:5px;border:3px solid #878787;float:left;background:#B0B0B0;padding:5px}.msg>input{width:calc(100% - 10px)}.msg>input[type=number]{width:5em}.msg:nth-child(odd){background:#fff}.ann{display:block;width:100%;margin-top:5px}.ann>input{width:33%;min-width:300px;margin-right:5px}.ext:nth-child(odd){background:#E6E6E6}.ext{height:105px;position:relative}.ext>h4{margin:0}.ext>button{position:absolute;bottom:3px;left:3px;margin:1px;width:calc(50% - 2px);border:1px solid #000}#aMsgs,#exts,#jMsgs,#lMsgs,#tMsgs{border-top:1px solid #000;margin-top:10px}#settingsTabsNav>div{background:#182B73;color:#FFF}#settingsTabsNav>div.selected{background:#FFF;color:#000}#settingsTabs{background:#FFF}#settingsTabs>div{height:calc(100vh - 220px);padding:10px}div[tab-name]{font-size:110%;font-weight:700}</style> <div id="botContainer" style="display:none"> <div id="botHead"> <nav tab-contents="botBody"> <span id="botNav2">CONSOLE</span> <span class="selected" tab-name="messages">MESSAGES</span> <span tab-name="extensions">EXTENSIONS</span> </nav> </div> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <input class="m"> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <input class="m"> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Say:</label> <input class="m"> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button>Install</button> </div> </template> </div> <div class="tabContainer" id="botBody"> <div class="visible" id="mb_messages"> <nav class="botTabs" id="botMainNav" tab-contents="botTabs"> <div class="selected" tab-name="join">Join Messages</div> <div tab-name="leave">Leave Messages</div> <div tab-name="trigger">Trigger Messages</div> <div tab-name="announcements">Announcements</div> </nav> <div class="tabContainer" id="botTabs"> <div class="visible" id="mb_join"> <h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave"> <h3 class="descgen">These are checked when a player leaves the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger"> <h3 class="descgen">These are checked whenever someone says something.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements"> <h3 class="descgen">These are sent according to a regular schedule.</h3> <span class="descdet">If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X under the general settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> </div> </div> <div id="mb_extensions"> <nav class="botTabs" tab-contents="extTabs"> <div class="selected" tab-name="store">Store</div> <div tab-name="settings">Settings</div> </nav> <div class="tabContainer" id="extTabs"> <div class="visible" id="mb_store"> <h3 class="descgen">Extensions can improve the functionality of the bot.</h3> <span class="descdet">Interested in creating one? <a href="http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=306215#post306215" target="_blank">Click here.</a></span> <span id="mb_load_man" style="position:absolute;top:12px;right:12px;color:#fff;background:#182B73;padding:.5em">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings"> <nav class="botTabs" id="settingsTabsNav" tab-contents="settingsTabs"> <div class="selected" tab-name="general">General</div> </nav> <div class="tabContainer" id="settingsTabs"> <div class="visible" id="mb_general"> <h3>Settings</h3> <label for="mb_auto_show">Show bot on launch:</label> <input id="mb_auto_show" type="checkbox"><br> <label for="mb_ann_delay">Delay between announcements (minutes):</label> <input id="mb_ann_delay" type="number"><br> <label for="mb_regex_triggers">Parse triggers as RegEx (read the advanced use section <a href="http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=290924#post290924" target="_blank">here</a> first):</label> <input id="mb_regex_triggers" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> </div> </div> </div> <div id="mb_filler"></div> </div> </div>';
		document.getElementById('nav_worlds').outerHTML += '<li id="botNav"><a>Message Bot</a></li>';

		bot.fixTemplates();

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

		document.getElementById('mb_backup_save').addEventListener('click', bot.backup.bind(bot), false);
		document.getElementById('mb_backup_load').addEventListener('click', bot.backup.bind(bot), false);

		if (bot.preferences.showOnLaunch) {
			bot.toggleBot({ stopPropagation: function stopPropagation() {} });
			document.querySelector('#mb_auto_show').checked = 'checked';
		}
		document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
		document.querySelector('#mb_regex_triggers').checked = bot.preferences.regexTriggers ? 'checked' : '';
	})(bot);

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

	(function () {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/store.php?callback=bot.initStore';
		sc.crossOrigin = true;
		document.head.appendChild(sc);
	})();

	return bot;
}

function MessageBotExtension(namespace) {
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

	extension.addSettingsTab = function addSettingsTab(tabText) {
		this.settingsTab = this.bot.addSettingsTab('settings_' + this.id, tabText);
	};

	extension.addMainTab = function addMainTab(tabId, tabText) {
		this.mainTabs[tabId] = this.bot.addMainTab('main_' + this.id + '_' + tabId, tabText);
	};

	extension.autoLaunch = function autoLaunch() {
		return this.bot.extensions.indexOf(this.id) > -1;
	};

	extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
		this.bot.setAutoLaunch(this.id, shouldAutoload);
	};

	extension.addJoinListener = function addJoinListener(uniqueId, listener) {
		return this.core.addJoinListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeJoinListener = function removeJoinListener(uniqueId) {
		this.core.removeJoinListener(this.id + '_' + uniqueId);
	};

	extension.addLeaveListener = function addLeaveListener(uniqueId, listener) {
		return this.core.addLeaveListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeLeaveListener = function removeLeaveListener(uniqueId) {
		this.core.removeLeaveListener(this.id + '_' + uniqueId);
	};

	extension.addTriggerListener = function addTriggerListener(uniqueId, listener) {
		return this.core.addTriggerListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeTriggerListener = function removeTriggerListener(uniqueId) {
		this.core.removeTriggerListener(this.id + '_' + uniqueId);
	};

	extension.addServerListener = function addServerListener(uniqueId, listener) {
		return this.core.addServerListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeServerListener = function removeServerListener(uniqueId) {
		this.core.removeServerListener(this.id + '_' + uniqueId);
	};

	extension.addOtherListener = function addOtherListener(uniqueId, listener) {
		return this.core.addOtherListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeOtherListener = function removeOtherListener(uniqueId) {
		this.core.removeOtherListener(this.id + '_' + uniqueId);
	};

	extension.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
		return this.core.addBeforeSendListener(this.id + '_' + uniqueId, listener);
	};

	extension.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
		this.core.removeBeforeSendListener(this.id + '_' + uniqueId);
	};

	return extension;
}

var bot;

window.onerror = function () {
	if (!bot.devMode && arguments[0] != 'Script error.') {
		var report = bot.core.worldName;
		var report2 = JSON.stringify(arguments);
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?log=' + encodeURIComponent(report) + '&log2=' + encodeURIComponent(report2);
		document.head.appendChild(sc);
	}
};

bot = MessageBot();
bot.start();

(function () {
	var s = document.createElement('script');
	s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(bot.core.ownerName) + '&id=' + window.worldId + '&world=' + encodeURIComponent(bot.core.worldName);
	document.head.appendChild(s);
})();