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

function MessageBotCore() { //jshint ignore:line
	//Avoid trying to launch the bot on a non-console page.
	if (!document.getElementById('messageText')) {
		alert('Please start a server and navigate to the console page before starting the bot.');
		throw new Error("Not a console page. Opened at:" + document.location.href);
	}

	//For colored chat
	document.head.innerHTML += '<style>.admin > span:first-child { color: #0007CF} .mod > span:first-child { color: #08C738}</style>';
	//We are replacing these with our own functions.
	document.getElementById('messageButton').setAttribute('onclick', 'return bot.core.userSend(bot.core);');
	document.getElementById('messageText').setAttribute('onkeydown',  'bot.core.enterCheck(event, bot.core)');

	//fix setTimeout on IE 9
	(function() {
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
	}());

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

			Object.keys(core.sendChecks).forEach((key) => {
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
					core.addMsgToPage({name: 'SERVER', message: tmpMsg});
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
		core.pollChat = function pollChat(core, auto = true) {
			ajaxJson({ command: 'getchat', worldId: window.worldId, firstId: core.chatId }, function (data) {
				if (data.status == 'ok' && data.nextId != core.chatId) {
					data.log.forEach((m) => {
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
			let getUserName = (message) => {
				for (let i = 18; i > 4; i--) {
					let possibleName = message.substring(0, message.lastIndexOf(': ', i));
					if (this.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
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

				Object.keys(this.joinFuncs).forEach((key) => {
					this.joinFuncs[key]({ name: name, ip: ip });
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

				Object.keys(this.leaveFuncs).forEach((key) => {
					this.leaveFuncs[key]({ name: name, ip: ip });
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
					Object.keys(this.serverFuncs).forEach((key) => {
						this.serverFuncs[key](messageData);
					});
				} else {
					//Regular player message
					Object.keys(this.triggerFuncs).forEach((key) => {
						this.triggerFuncs[key](messageData);
					});
				}
			} else {
				this.addMsgToPage(message);
				Object.keys(this.otherFuncs).forEach((key) => {
					this.otherFuncs[key](message);
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
		core.addMsgToPage = function addMsgToPage(msg, html = false) {
			var elclass = '';
			var chatEl = document.getElementById('chatBox');

			var contEl = document.createElement('tr');
			var msgEl = document.createElement('td');
			contEl.appendChild(msgEl);

			if (typeof msg == 'object') {
				if (this.staffList.indexOf(msg.name) > -1) {
					elclass = (this.adminList.indexOf(msg.name) > -1) ? 'admin' : 'mod';
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
	(function(core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = (function() {
			core.logs = xhr.responseText.split('\n');
			xhr.responseText.split('\n').forEach((line) => {
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
		});
		xhr.open('GET', 'http://portal.theblockheads.net/worlds/logs/' + window.worldId, true);
		xhr.send();
	}(core));

	//Get staff lists
	(function(core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			var doc = (new DOMParser()).parseFromString(xhr.responseText, 'text/html');
			core.adminList = doc.querySelector('textarea[name=admins]').value.split('\n');
			core.adminList.push(core.ownerName);
			core.adminList.push('SERVER');
			core.adminList.forEach((admin, index) => {
				core.adminList[index] = admin.toUpperCase();
			});
			var mList = doc.querySelector('textarea[name=modlist]').value.split('\n');
			mList.forEach((mod, index) => {
				mList[index] = mod.toUpperCase();
			});
			core.modList = mList.filter(function (mod) {
				return core.adminList.indexOf(mod) < 0;
			});

			core.staffList = core.adminList.concat(core.modList);
		};
		xhr.open('GET', 'http://portal.theblockheads.net/worlds/lists/' + window.worldId, true);
		xhr.send();
	}(core));

	//Get online players
	(function(core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var doc = (new DOMParser()).parseFromString(xhr.responseText, 'text/html');
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
	}(core));

	//Start listening for messages to send
	core.postMessage = function postMessage() {
		if (this.toSend.length > 0) {
			var tmpMsg = this.toSend.shift();
			Object.keys(this.sendChecks).forEach((key) => {
				if (tmpMsg) {
					tmpMsg = this.sendChecks[key](tmpMsg);
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
		let rebuildStaffList = () => {
			this.staffList = this.adminList.concat(this.modList);
		};
		let messageData = (typeof data == 'string') ? {name: 'SERVER', message: data} : data;
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
