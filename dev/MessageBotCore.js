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
	core.chatId = window.chatId || 0;

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
		 * Passes the oldest queued message through checks and sends it if it passes all checks.
		 *
		 * @return void
		 */
		core.postMessage = function postMessage() {
			if (this.toSend.length > 0) {
				var tmpMsg = this.toSend.shift();
				Object.keys(this.sendChecks).forEach((key) => {
					if (tmpMsg) {
						tmpMsg = this.sendChecks[key](tmpMsg);
					}
				});
				if (tmpMsg) {
					this.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg });
				}
			}
			setTimeout(this.postMessage.bind(this), this.sendDelay);
		};

		/**
		 * Lets users send messages from the console, also ensures that commands are displayed and not eaten
		 *
		 * @param MessageBotCore core a reference to the core
		 * @return void
		 */
		core.userSend = function userSend(core) {
			var button = document.querySelector('#mb_console > div:nth-child(2) > button');
			var message = document.querySelector('#mb_console > div:nth-child(2) > input');
			var tmpMsg = message.value;

			Object.keys(core.sendChecks).forEach((key) => {
				if (tmpMsg) {
					tmpMsg = core.sendChecks[key](tmpMsg);
				}
			});

			if (tmpMsg) {
				button.setAttribute('disabled', '1');
				message.setAttribute('disabled', '1');
				core.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg }).then(function (data) {
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
				}).then(function() {
					if (tmpMsg.indexOf('/') === 0) {
						core.addMessageToPage({name: 'SERVER', message: tmpMsg});
					}
				}).catch(function(error) {
					core.addMessageToPage(`<span style="color:#f00;">Sending error: ${error}</span>`, true);
				}).then(function() {
					core.scrollToBottom();
				});
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
		/**
		 * Internal method. Use startListening and stopListening to control this function.
		 *
		 * @param MessageBotCore core a reference to the core.
		 * @param boolean auto whether or not to keep polling.
		 * @return void
		 */
		core.pollChat = function pollChat(core, auto = true) {
			core.ajax.postJSON(window.apiURL, { command: 'getchat', worldId: window.worldId, firstId: core.chatId }).then(function(data) {
				if (data.status == 'ok' && data.nextId != core.chatId) {
					data.log.forEach((m) => {
						core.parseMessage(m);
					});
					core.chatId = data.nextId;
				} else if (data.status == 'error') {
					setTimeout(core.pollChat, core.checkOnlineWait, core);
					throw new Error(data.message);
				}
			}).then(function() {
				if (auto) {
					setTimeout(core.pollChat, 5000, core);
				}
			}).catch(function(error) {
				//We are offline.
				core.addMessageToPage(`<span style="color:#f00;">Error: ${error}.</span>`, true);
			});
		};

		/**
		 * Function used to scroll chat to show new messages.
		 *
		 * @return void
		 */
		core.scrollToBottom = function scrollToBottom() {
			let el = document.querySelector('#mb_console > div > ul');
			el.scrollTop = el.scrollHeight - el.scrollTop;
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

			if (message.indexOf(this.worldName + ' - Player Connected ') === 0) {
				this.addMessageToPage(message);

				let name = message.substring(this.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
				let ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

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
					this.joinFuncs[key]({name, ip});
				});
			} else if (message.indexOf(this.worldName + ' - Player Disconnected ') === 0) {
				this.addMessageToPage(message);

				let name = message.substring(this.worldName.length + 23);
				let ip = this.getIP(name);
				//Remove the user from the online list.
				var playerIn = this.online.indexOf(name);
				if (playerIn > -1) {
					this.online.splice(name, 1);
				}

				Object.keys(this.leaveFuncs).forEach((key) => {
					this.leaveFuncs[key]({name, ip});
				});
			} else if (message.indexOf(': ') >= 0) {
				//A chat message - server or player?
				var messageData = getUserName(message);
				messageData.message = message.substring(messageData.name.length + 2);
				this.addMessageToPage(messageData);
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
				this.addMessageToPage(message);
				Object.keys(this.otherFuncs).forEach((key) => {
					this.otherFuncs[key](message);
				});
			}
		};
	}

	//Dealing with the UI
	{
		/**
		 * Adds a message to the console, expects this to be assigned to the core
		 *
		 * @param string|object Either an object with properties name and message, or a string
		 * @return void
		 */
		core.addMessageToPage = function addMessageToPage(msg, html = false) {
			var msgEl = document.createElement('li');

			if (typeof msg == 'object') {
				if (this.staffList.indexOf(msg.name) > -1) {
					msgEl.setAttribute('class', (this.adminList.indexOf(msg.name) > -1) ? 'admin' : 'mod');
				}
				msgEl.appendChild(document.createElement('span'));
				msgEl.querySelector('span').textContent = msg.name;

				msgEl.appendChild(document.createElement('span'));
				msgEl.querySelector('span:nth-child(2)').textContent = ': ' + msg.message;
			} else {
				if (html) {
					msgEl.innerHTML = msg;
				} else {
					msgEl.textContent = msg;
				}
			}

			var chat = document.querySelector('#mb_console ul');
			chat.appendChild(msgEl);

			core.scrollToBottom();

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
			this.chatId = (window.chatId < 20) ? 0 : window.chatId - 20;
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

	//For making requests
	core.ajax = (function() {
		/**
		 * Helper function to make XHR requests.
		 *
		 * @param string protocol
		 * @param string url
		 * @param object paramObj -- WARNING. Only accepts shallow objects.
		 * @return Promise
		 */
		function xhr(protocol, url = '/', paramObj = {}) {
			var paramStr = Object.keys(paramObj)
								.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(paramObj[k])}`)
								.join('&');
			return new Promise(function(resolve, reject) {
				var req = new XMLHttpRequest();
				req.open(protocol, url);
				req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				if (protocol == 'POST') {
					req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}

				req.onload = function() {
					if (req.status == 200) {
						resolve(req.response);
					} else {
						reject(Error(req.statusText));
					}
				};
				// Handle network errors
				req.onerror = function() {
					reject(Error("Network Error"));
				};
				if (paramStr) {
					req.send(paramStr);
				} else {
					req.send();
				}
			});
		}

		/**
		 * Function to GET a page. Passes the response of the XHR in the resolve promise.
		 *
		 * @param string url
		 * @param string paramStr
		 * @return Promise
		 */
		function get(url = '/', paramObj = {}) {
			return xhr('GET', url, paramObj);
		}

		/**
		 * Returns a JSON object in the promise resolve method.
 		 *
		 * @param string url
		 * @param object paramObj
		 * @return Promise
		 */
		function getJSON(url = '/', paramObj = {}) {
			return get(url, paramObj).then(JSON.parse);
		}

		/**
		 * Function to make a post request
		 *
		 * @param string url
		 * @param object paramObj
		 * @return Promise
		 */
		function post(url = '/', paramObj = {}) {
			return xhr('POST', url, paramObj);
		}

		/**
		 * Function to fetch JSON from a page through post.
		 *
		 * @param string url
		 * @param string paramObj
		 * @return Promise
		 */
		function postJSON(url = '/', paramObj = {}) {
			return post(url, paramObj).then(JSON.parse);
		}

		return {xhr, get, getJSON, post, postJSON};
	}());

	//Get the player list
	core.ajax.get(`/worlds/logs/${window.worldId}`).then(function(response) {
		core.logs = response.split('\n');
		core.logs.forEach((line) => {
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

	//Get staff lists
	core.ajax.get(`/worlds/lists/${window.worldId}`).then(function(response) {
		var doc = (new DOMParser()).parseFromString(response, 'text/html');
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
	});

	//Get online players
	core.ajax.get(`/worlds/${window.worldId}`).then(function(response) {
		var doc = (new DOMParser()).parseFromString(response, 'text/html');
		core.ownerName = doc.querySelector('.subheader~tr>td:not([class])').textContent;
		var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
		var playerElemsCount = playerElems.length;
		for (var i = 0; i < playerElemsCount; i++) {
			if (core.online.indexOf(playerElems[i].textContent) < 0) {
				core.online.push(playerElems[i].textContent);
			}
		}
		//Track launches
		var s = document.createElement('script');
		s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(core.ownerName) + '&id=' + window.worldId + '&world=' + encodeURIComponent(core.worldName);
		document.head.appendChild(s);
	});

	//Start listening for messages to send
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
