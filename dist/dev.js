'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function () {};

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
			if (core.toSend.length > 0) {
				var tmpMsg = core.toSend.shift();
				Object.keys(core.sendChecks).forEach(function (key) {
					if (tmpMsg) {
						try {
							tmpMsg = core.sendChecks[key].listener(tmpMsg);
						} catch (e) {
							console.log(e);
							core.reportError(e, core.sendChecks[key].owner);
						}
					}
				});
				if (tmpMsg) {
					core.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg });
				}
			}
			setTimeout(core.postMessage.bind(core), core.sendDelay);
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

			Object.keys(core.sendChecks).forEach(function (key) {
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
				}).then(function () {
					if (tmpMsg.indexOf('/') === 0) {
						core.addMessageToPage({ name: 'SERVER', message: tmpMsg });
					}
				}).catch(function (error) {
					core.addMessageToPage('<span style="color:#f00;">Error sending: ' + error + '</span>', true);
					core.reportError(error, 'bot');
				}).then(function () {
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
		core.pollChat = function pollChat(core) {
			var auto = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

			core.ajax.postJSON(window.apiURL, { command: 'getchat', worldId: window.worldId, firstId: core.chatId }).then(function (data) {
				if (data.status == 'ok' && data.nextId != core.chatId) {
					data.log.forEach(function (m) {
						core.parseMessage(m);
					});
					core.chatId = data.nextId;
				} else if (data.status == 'error') {
					setTimeout(core.pollChat, core.checkOnlineWait, core);
					throw new Error(data.message);
				}
			}).then(function () {
				if (auto) {
					setTimeout(core.pollChat, 5000, core);
				}
			});
		};

		/**
   * Function used to scroll chat to show new messages.
   *
   * @return void
   */
		core.scrollToBottom = function scrollToBottom() {
			var el = document.querySelector('#mb_console > div > ul');
			el.scrollTop = el.scrollHeight - el.scrollTop;
		};

		/**
   * Used to parse messages recieved from the server into objects which can be used. Also calls appropriate listeners.
   */
		core.parseMessage = function parseMessage(message) {
			var getUserName = function getUserName(message) {
				for (var i = 18; i > 4; i--) {
					var possibleName = message.substring(0, message.lastIndexOf(': ', i));
					if (core.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
						return { name: possibleName, safe: true };
					}
				}
				//The user is not in our online list. Use the old substring method without checking that the user is online
				return { name: message.substring(0, message.lastIndexOf(': ', 18)), safe: false };
			};

			if (message.indexOf(core.worldName + ' - Player Connected ') === 0) {
				(function () {
					core.addMessageToPage(message);

					var name = message.substring(core.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
					var ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

					//Update player values
					if (core.players.hasOwnProperty(name)) {
						//Returning player
						core.players[name].joins++;
					} else {
						//New player
						core.players[name] = {};
						core.players[name].joins = 1;
						core.players[name].ips = [];
					}
					core.players[name].ip = ip;
					core.online.push(name);

					Object.keys(core.joinFuncs).forEach(function (key) {
						try {
							core.joinFuncs[key].listener({ name: name, ip: ip });
						} catch (e) {
							console.log('Error', e);
							core.reportError(e, core.joinFuncs[key].owner);
						}
					});
				})();
			} else if (message.indexOf(core.worldName + ' - Player Disconnected ') === 0) {
				var playerIn;

				(function () {
					core.addMessageToPage(message);

					var name = message.substring(core.worldName.length + 23);
					var ip = core.getIP(name);
					//Remove the user from the online list.
					playerIn = core.online.indexOf(name);

					if (playerIn > -1) {
						core.online.splice(name, 1);
					}

					Object.keys(core.leaveFuncs).forEach(function (key) {
						try {
							core.leaveFuncs[key].listener({ name: name, ip: ip });
						} catch (e) {
							console.log('Error', e);
							core.reportError(e, core.leaveFuncs[key].owner);
						}
					});
				})();
			} else if (message.indexOf(': ') >= 0) {
				//A chat message - server or player?
				var messageData = getUserName(message);
				messageData.message = message.substring(messageData.name.length + 2);
				core.addMessageToPage(messageData);
				//messageData resembles this:
				//	{name:"ABC123", message:"Hello there!", safe:true}

				if (messageData.name == 'SERVER') {
					//Server message
					Object.keys(core.serverFuncs).forEach(function (key) {
						try {
							core.serverFuncs[key].listener(messageData);
						} catch (e) {
							console.log('Error', e);
							core.reportError(e, core.serverFuncs[key].owner);
						}
					});
				} else {
					//Regular player message
					Object.keys(core.triggerFuncs).forEach(function (key) {
						try {
							core.triggerFuncs[key].listener(messageData);
						} catch (e) {
							console.log('Error', e);
							core.reportError(e, core.triggerFuncs[key].owner);
						}
					});
				}
			} else {
				core.addMessageToPage(message);
				Object.keys(core.otherFuncs).forEach(function (key) {
					try {
						core.otherFuncs[key].listener(message);
					} catch (e) {
						console.log('Error', e);
						core.reportError(e, core.otherFuncs[key].owner);
					}
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
		core.addMessageToPage = function addMessageToPage(msg) {
			var html = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

			var msgEl = document.createElement('li');

			if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) == 'object') {
				if (core.staffList.indexOf(msg.name) > -1) {
					msgEl.setAttribute('class', core.adminList.indexOf(msg.name) > -1 ? 'admin' : 'mod');
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

			while (chat.children.length > core.chatMsgMaxCount) {
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
			if (core.players.hasOwnProperty(name)) {
				return core.players[name].ip;
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
			if (core.players.hasOwnProperty(name)) {
				return core.players[name].joins;
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
			core.chatId = window.chatId < 20 ? 0 : window.chatId - 20;
			core.pollChat(core);
			core.listening = true;
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
		core.addJoinListener = function addJoinListener(uniqueId, owner, listener) {
			if (!core.joinFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.joinFuncs[uniqueId] = { owner: owner, listener: listener };
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
			delete core.joinFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used
   */
		core.addLeaveListener = function addLeaveListener(uniqueId, owner, listener) {
			if (!core.leaveFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.leaveFuncs[uniqueId] = { owner: owner, listener: listener };
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
			delete core.leaveFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addTriggerListener = function addTriggerListener(uniqueId, owner, listener) {
			if (!core.triggerFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.triggerFuncs[uniqueId] = { owner: owner, listener: listener };
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
			delete core.joinFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addServerListener = function addServerListener(uniqueId, owner, listener) {
			if (!core.serverFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.serverFuncs[uniqueId] = { owner: owner, listener: listener };
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
			delete core.serverFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addOtherListener = function addOtherListener(uniqueId, owner, listener) {
			if (!core.otherFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.otherFuncs[uniqueId] = { owner: owner, listener: listener };
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
			delete core.otherFuncs[uniqueId];
		};

		/**
   * Method used to add a listener
   *
   * @param string uniqueId the unique id of the listener
   * @param function listener the function which will be attatched to join messages
   * @return bool true on success, false if the unique ID has already been used or the listener is not a function
   */
		core.addBeforeSendListener = function addBeforeSendListener(uniqueId, owner, listener) {
			if (!core.sendChecks.hasOwnProperty(uniqueId) && typeof listener == "function") {
				core.sendChecks[uniqueId] = { owner: owner, listener: listener };
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
			delete core.sendChecks[uniqueId];
		};
	}

	//For making requests
	core.ajax = function () {
		/**
   * Helper function to make XHR requests.
   *
   * @param string protocol
   * @param string url
   * @param object paramObj -- WARNING. Only accepts shallow objects.
   * @return Promise
   */
		function xhr(protocol) {
			var url = arguments.length <= 1 || arguments[1] === undefined ? '/' : arguments[1];
			var paramObj = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

			var paramStr = Object.keys(paramObj).map(function (k) {
				return encodeURIComponent(k) + '=' + encodeURIComponent(paramObj[k]);
			}).join('&');
			return new Promise(function (resolve, reject) {
				var req = new XMLHttpRequest();
				req.open(protocol, url);
				req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				if (protocol == 'POST') {
					req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}

				req.onload = function () {
					if (req.status == 200) {
						resolve(req.response);
					} else {
						reject(Error(req.statusText));
					}
				};
				// Handle network errors
				req.onerror = function () {
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
		function get() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return xhr('GET', url, paramObj);
		}

		/**
   * Returns a JSON object in the promise resolve method.
  	 *
   * @param string url
   * @param object paramObj
   * @return Promise
   */
		function getJSON() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return get(url, paramObj).then(JSON.parse);
		}

		/**
   * Function to make a post request
   *
   * @param string url
   * @param object paramObj
   * @return Promise
   */
		function post() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return xhr('POST', url, paramObj);
		}

		/**
   * Function to fetch JSON from a page through post.
   *
   * @param string url
   * @param string paramObj
   * @return Promise
   */
		function postJSON() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return post(url, paramObj).then(JSON.parse);
		}

		return { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };
	}();

	//For handling errors nicely
	core.reportError = function (err, owner) {
		console.info('Reporting error (core):', err, owner);
		window.bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error', {
			world_name: window.bot.core.worldName,
			world_id: window.worldId,
			owner_name: window.bot.core.ownerName,
			bot_version: window.bot.version,
			error_text: err.message,
			error_file: 'http://blockheadsfans.com/messagebot/extension/' + owner + '/code/raw/',
			error_row: err.lineno || 0,
			error_column: err.colno || 0
		}).then(function (resp) {
			if (resp.status == 'ok') {
				window.bot.ui.notify('Something went wrong, it has been reported.');
			} else {
				throw new Error(resp.message);
			}
		}).catch(function (err) {
			console.error(err);
			window.bot.ui.notify('Error reporting exception: ' + err);
		});
	};

	//Get the player list
	core.ajax.get('/worlds/logs/' + window.worldId).then(function (response) {
		core.logs = response.split('\n');
		core.logs.forEach(function (line) {
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
	core.ajax.get('/worlds/lists/' + window.worldId).then(function (response) {
		var doc = new DOMParser().parseFromString(response, 'text/html');
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
	});

	//Get online players
	core.ajax.get('/worlds/' + window.worldId).then(function (response) {
		var doc = new DOMParser().parseFromString(response, 'text/html');
		core.ownerName = doc.querySelector('.subheader~tr>td:not([class])').textContent;
		var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
		var playerElemsCount = playerElems.length;
		for (var i = 0; i < playerElemsCount; i++) {
			if (core.online.indexOf(playerElems[i].textContent) < 0) {
				core.online.push(playerElems[i].textContent);
			}
		}
	});

	//Start listening for messages to send
	core.postMessage();

	//Start listening for admin / mod changes
	core.staffChangeCheck = function staffChangeCheck(data) {
		var rebuildStaffList = function rebuildStaffList() {
			core.staffList = core.adminList.concat(core.modList);
		};
		var messageData = typeof data == 'string' ? { name: 'SERVER', message: data } : data;
		if (core.adminList.indexOf(messageData.name) != -1) {
			var targetName;
			switch (messageData.message.toLocaleUpperCase().substring(0, messageData.message.indexOf(' '))) {
				case '/ADMIN':
					targetName = messageData.message.toLocaleUpperCase().substring(7);
					if (core.adminList.indexOf(targetName) < 0) {
						core.adminList.push(targetName);
						rebuildStaffList();
					}
					break;
				case '/UNADMIN':
					targetName = messageData.message.toLocaleUpperCase().substring(10);
					if (core.adminList.indexOf(targetName) != -1) {
						core.modList.splice(core.adminList.indexOf(targetName), 1);
						rebuildStaffList();
					}
					break;
				case '/MOD':
					targetName = messageData.message.toLocaleUpperCase().substring(5);
					if (core.modList.indexOf(targetName) < 0) {
						core.modList.push(targetName);
						rebuildStaffList();
					}
					break;
				case '/UNMOD':
					targetName = messageData.message.toLocaleUpperCase().substring(7);
					if (core.modList.indexOf(targetName) != -1) {
						core.modList.splice(core.modList.indexOf(targetName), 1);
						rebuildStaffList();
					}
			}
		}
		return data;
	};
	core.addServerListener('core_staffChanges', 'bot', core.staffChangeCheck.bind(core));
	core.addTriggerListener('core_staffChanges', 'bot', core.staffChangeCheck.bind(core));

	return core;
}

function MessageBotUI() {
	//jshint ignore:line
	document.head.innerHTML = '<title>Console</title> <meta name="viewport" content="width=device-width,initial-scale=1">';
	document.head.innerHTML += '<style>.button,a{cursor:pointer}body,html{min-height:100vh;position:relative;width:100%;margin:0;font-family:"Lucida Grande","Lucida Sans Unicode",Verdana,sans-serif}a{color:#182b73}#container>div:not(#header){display:none;padding:10px}#container>div.visible:not(#header),#mainNav{display:block}.overlay{position:fixed;top:0;left:0;bottom:0;right:0;opacity:0;visibility:hidden;z-index:8999;background:rgba(0,0,0,.6);transition:opacity .5s}#mainNav,#mainToggle{color:#fff;position:absolute;z-index:9999}#header{height:80px;width:100%;background:url(http://portal.theblockheads.net/static/images/portalHeader.png) 50px 0 no-repeat #051465}#mainNav{background:#182b73;padding-bottom:50px;width:250px;top:0;left:-250px;bottom:0;transition:left .5s;overflow:auto;-webkit-overflow-scrolling:touch}#toggle{display:none}#mainToggle{background:rgba(255,255,255,.2);padding:5px;top:5px;left:5px;opacity:1;transition:left .5s,opacity .5s}.tab,.tab-header{display:block;padding:10px 0;text-align:center}.tab,.tab-group{border-bottom:1px solid rgba(255,255,255,.2)}.tab-body>.tab{border-bottom:1px solid #182B73}.tab.selected{background:radial-gradient(#7D88B3,#182B73)}.tab-body>.tab.selected{background:radial-gradient(#182B73,#7D88B3)}.tab-header-toggle{display:none}.tab-header{padding:10px 0 5px;display:block;text-align:center}.tab-body{background:rgba(255,255,255,.2);border-radius:10px;width:80%;margin-left:10%}.tab-header-toggle~.tab-body{overflow:hidden;max-height:0;margin-bottom:5px;transition:.5s cubic-bezier(0,1,.5,1)}.tab-header-toggle~.tab-header:after{font-size:50%;content:"▼";position:relative;top:-.25em;left:.5em}.tab-header-toggle:checked~.tab-body{display:block;transition:.5s ease-in;max-height:1000px;overflow:hidden}.tab-header-toggle:checked~.tab-header:after{content:"▲"}#mb_console>div:nth-child(1){height:calc(100vh - 220px)}@media screen and (min-width:668px){#mb_console>div:nth-child(1){height:calc(100vh - 150px)}}#mb_console>div>ul{height:100%;overflow-y:auto;width:100%;margin:0;padding:0}.mod>span:first-child{color:#05f529}.admin>span:first-child{color:#2b26bd}#mb_console>div:nth-child(2){display:flex}#mb_console button,#mb_console input{padding:5px;font-size:1em;margin:5px 0}#mb_console input{flex:1;border:1px solid #999}#mb_console button{background-color:#182b73;font-weight:700;color:#fff;border:0;height:40px}#toggle:checked~#mainToggle{left:255px;opacity:0;transition:left .5s,opacity .5s}#toggle:checked~#navOverlay{visibility:visible;opacity:1}#toggle:checked~#mainNav{left:0;transition:left .5s}#alert{visibility:hidden;position:fixed;left:0;right:0;top:50px;margin:auto;background:#fff;width:50%;border-radius:10px;padding:10px 10px 55px;min-width:300px;min-height:200px;z-index:8000}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}.button{color:#000;display:inline-block;padding:6px 12px;margin:0 5px;font-size:14px;line-height:1.428571429;text-align:center;white-space:nowrap;vertical-align:middle;border:1px solid rgba(0,0,0,.15);border-radius:4px;background:linear-gradient(to bottom,#fff 0,#e0e0e0 100%) #fff}.button-sm{padding:1px 5px;font-size:12px;line-height:1.5;border-radius:3px}.danger,.info,.success,.warning{color:#fff}.success{background:linear-gradient(to bottom,#5cb85c 0,#419641 100%) #5cb85c;border-color:#3e8f3e}.info{background:linear-gradient(to bottom,#5bc0de 0,#2aabd2 100%) #5bc0de;border-color:#28a4c9}.danger{background:linear-gradient(to bottom,#d9534f 0,#c12e2a 100%) #d9534f;border-color:#b92c28}.warning{background:linear-gradient(to bottom,#f0ad4e 0,#eb9316 100%) #f0ad4e;border-color:#e38d13}#alertOverlay{z-index:7999}#alert.visible,#alertOverlay.visible{visibility:visible;opacity:1}.notification{color:#fff;position:fixed;top:1em;right:1em;opacity:0;min-width:200px;border-radius:5px;background:#051465;padding:5px;transition:opacity 2s}.notification.visible{opacity:1}.ext,.msg{position:relative;width:calc(33% - 19px);min-width:280px;margin-left:5px;margin-bottom:5px;border:3px solid #878787;border-radius:10px;float:left;padding:5px}.ext p{margin:0}.ext:nth-child(odd),.msg:nth-child(odd){background:#C6C6C6}.msg>input{width:calc(100% - 10px);border:2px solid #666}.msg>input[type=number]{width:5em}.descgen{margin:0 0 5px}#mb_load_man,.add{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:90px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}#mb_load_man{width:inherit;padding:0 7px}#aMsgs,#exts,#jMsgs,#lMsgs,#tMsgs{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 165px)}.ext{height:120px}.ext>h4{margin:0}.ext>button{position:absolute;bottom:7px;padding:3px 8px}.tabContainer>div{display:none;min-height:calc(100vh - 175px)}.tabContainer>div.visible{display:block}.botTabs{width:100%;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-flow:row wrap;flex-flow:row wrap}.botTabs>div{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;-webkit-flex-grow:1;flex-grow:1;height:40px;margin-top:5px;margin-right:5px;min-width:120px;background:#182B73;color:#FFF;font-family:"Lucida Grande","Lucida Sans Unicode",sans-serif}.botTabs>div:last-child{margin-right:0}.botTabs>div.selected{color:#000;background:#E7E7E7}<style>';
	document.body.innerHTML = '<input type="checkbox" name="menu" id="toggle"> <label for="toggle" id="mainToggle">&#9776; Menu</label> <nav id="mainNav"> <div id="mainNavContents"> <span class="tab selected" g-tab-name="console">CONSOLE</span> <div class="tab-group"> <input type="checkbox" name="group_msgs" id="group_msgs" class="tab-header-toggle"> <label class="tab-header" for="group_msgs">MESSAGES</label> <div class="tab-body" id="msgs_tabs"> <span class="tab" g-tab-name="join">JOIN</span> <span class="tab" g-tab-name="leave">LEAVE</span> <span class="tab" g-tab-name="trigger">TRIGGER</span> <span class="tab" g-tab-name="announcements">ANNOUNCEMENTS</span> </div> </div> <span class="tab" g-tab-name="extensions">EXTENSIONS</span> <span class="tab" g-tab-name="settings">SETTINGS</span> </div> <div class="clearfix"></div> </nav> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <input class="m"> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <input class="m"> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Say:</label> <input class="m"> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button class="button">Install</button> </div> </template> </div> <div id="navOverlay" class="overlay"></div> <div id="container"> <div id="header" class="visible"></div> <div id="mb_console" class="visible"> <div><ul></ul></div> <div><input type="text"><button>SEND</button></div> </div> <div id="mb_join"> <h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave"> <h3 class="descgen">These are checked when a player leaves the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger"> <h3 class="descgen">These are checked whenever someone says something.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements"> <h3 class="descgen">These are sent according to a regular schedule.</h3> <span class="descdet">If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> <div id="mb_extensions"> <h3 class="descgen">Extensions can increase the functionality of the bot.</h3> <span class="descdet">Interested in creating one? <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki" target="_blank">Click here.</a></span> <span id="mb_load_man">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings"> <h3>Settings</h3> <label for="mb_ann_delay">Delay between announcements (minutes): </label> <input id="mb_ann_delay" type="number"><br> <label for="mb_notify_message">Notification on new chat when not on console page: </label> <input id="mb_notify_message" type="checkbox"><br> <h3>Advanced Settings</h3> <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options" target="_blank">Read this first</a> <label for="mb_regex_triggers">Parse triggers as RegEx: </label> <input id="mb_regex_triggers" type="checkbox"><br> <label for="mb_disable_trim">Disable whitespace trimming: </label> <input id="mb_disable_trim" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> <div id="alert"> <div></div> <div class="buttons"> </div> </div> <div id="alertOverlay" class="overlay"></div>';

	var mainToggle = document.querySelector('#toggle');

	var ui = {
		alertActive: false,
		alertQueue: [],
		alertButtons: {}
	};

	/**
 * Function used to require action from the user.
 *
 * @param string text the text to display in the alert
 * @param Array buttons an array of buttons to add to the alert.
 *		Format: [{text: 'Test', style:'success', action: function(){}, thisArg: window, dismiss: false}]
 *		Note: text is the only required paramater. If no button array is specified
 *		then a single OK button will be shown.
 * 		Provided styles: success, danger, warning, info
 *		Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
 * @return void
 */
	ui.alert = function (text) {
		var buttons = arguments.length <= 1 || arguments[1] === undefined ? [{ text: 'OK' }] : arguments[1];

		function buildButton(ui, button) {
			var el = document.createElement('span');
			el.innerHTML = button.text;
			el.classList.add('button');
			if (button.style) {
				el.classList.add(button.style);
			}
			el.id = button.id;
			el.addEventListener('click', ui.buttonHandler.bind(ui));
			document.querySelector('#alert > .buttons').appendChild(el);
		}

		if (ui.alertActive) {
			ui.alertQueue.push({ text: text, buttons: buttons });
			return;
		}
		ui.alertActive = true;

		buttons.forEach(function (button, i) {
			button.dismiss = button.dismiss === false ? false : true; //Require that dismiss be set to false, otherwise true
			ui.alertButtons['button_' + i] = { action: button.action, thisArg: button.thisArg, dismiss: button.dismiss };
			button.id = 'button_' + i;
			buildButton(this, button);
		}.bind(this));
		document.querySelector('#alert > div').innerHTML = text;

		document.querySelector('#alertOverlay').classList.toggle('visible');
		document.querySelector('#alert').classList.toggle('visible');
	};

	/**
 * Function used to send a non-critical alert to the user.
 * Should be used in place of ui.alert if possible as it is non-blocking.
 *
 * @param String text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
 * @param Number displayTime the number of seconds to show the notification for.
 */
	ui.notify = function (text) {
		var displayTime = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];

		var el = document.createElement('div');
		el.classList.add('notification');
		el.classList.add('visible');
		el.textContent = text;
		document.body.appendChild(el);

		el.addEventListener('click', function () {
			this.remove();
		});
		setTimeout(function () {
			this.classList.remove('visible');
		}.bind(el), displayTime * 1000);
		setTimeout(function () {
			if (this.parentNode) {
				this.remove();
			}
		}.bind(el), displayTime * 1000 + 2100);
	};

	/**
 * Internal function used to call button actions when ui.alert() is called.
 * Note: this is bound to the UI.
 *
 * @param EventArgs event
 * @return void
 */
	ui.buttonHandler = function (event) {
		var alertButton = ui.alertButtons[event.target.id] || {};
		alertButton.thisArg = alertButton.thisArg || undefined;
		alertButton.dismiss = typeof alertButton.dismiss == 'boolean' ? alertButton.dismiss : true;
		if (typeof alertButton.action == 'function') {
			alertButton.action.call(alertButton.thisArg);
		}
		//Require that there be an action asociated with no-dismiss buttons.
		if (alertButton.dismiss || typeof alertButton.action != 'function') {
			document.querySelector('#alert').classList.toggle('visible');
			document.querySelector('#alertOverlay').classList.toggle('visible');
			document.querySelector('#alert > .buttons').innerHTML = '';
			ui.alertButtons = {};
			ui.alertActive = false;
			ui.checkAlertQueue();
		}
	};

	/**
 * Internal function used to check for more alerts that need to be shown.
 *
 * @return void
 */
	ui.checkAlertQueue = function () {
		if (ui.alertQueue.length) {
			var _alert = ui.alertQueue.shift();
			ui.alert(_alert.text, _alert.buttons);
		}
	};

	/**
  * Internal method used to change the page displayed to the user.
  *
  * @param EventArgs event
  * @return void
  */
	ui.globalTabChange = function (event) {
		if (event.target.getAttribute('g-tab-name') !== null) {
			//Content
			Array.from(document.querySelectorAll('div.visible:not(#header)')).forEach(function (el) {
				return el.classList.remove('visible');
			}); //We can't just remove the first due to browser lag
			document.querySelector('#mb_' + event.target.getAttribute('g-tab-name')).classList.add('visible');
			//Tabs
			document.querySelector('span.tab.selected').classList.remove('selected');
			event.target.classList.add('selected');
		}
	};

	/**
  * Hides / shows the menu
  *
  * @return void
  */
	ui.toggleMenu = function () {
		mainToggle.checked = !mainToggle.checked;
	};

	/**
  * Used to add a tab to the bot's navigation.
  *
  * @param string tabText
  * @param string tabId
  * @param string tabGroup the base of the ID of the group ID. Optional.
  * @return void
  */
	ui.addTab = function addTab(tabText, tabId) {
		var tabGroup = arguments.length <= 2 || arguments[2] === undefined ? '#mainNavContents' : arguments[2];

		if (tabGroup != '#mainNavContents') {
			tabGroup = '#' + tabGroup + '_tabs';
		}
		var tab = document.createElement('span');
		tab.textContent = tabText.toLocaleUpperCase();
		tab.classList.add('tab');
		tab.setAttribute('g-tab-name', tabId);
		document.querySelector(tabGroup).appendChild(tab);
		var tabContent = document.createElement('div');
		tabContent.id = 'mb_' + tabId;
		document.querySelector('#container').appendChild(tabContent);
	};

	/**
  * Removes a global tab by it's id.
  */
	ui.removeTab = function removeTab(tabId) {
		var tab = document.querySelector('[g-tab-name="' + tabId + '"]');
		if (tab) {
			tab.remove();
			document.querySelector('#mb_' + tabId).remove();
		}
	};

	ui.addTabGroup = function addTabGroup(text, groupId) {
		var container = document.createElement('div');
		container.classList.add('tab-group');
		var checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.name = 'group_' + groupId;
		checkbox.id = 'group_' + groupId;
		checkbox.classList.add('tab-header-toggle');
		container.appendChild(checkbox);
		var label = document.createElement('label');
		label.classList.add('tab-header');
		label.setAttribute('for', 'group_' + groupId);
		label.textContent = text;
		container.appendChild(label);
		var innerContainer = document.createElement('div');
		innerContainer.id = groupId + '_tabs';
		innerContainer.classList.add('tab-body');
		container.appendChild(innerContainer);
		document.querySelector('#mainNavContents').appendChild(container);
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
	ui.addInnerTab = function addInnerTab(navID, contentID, tabName, tabText) {
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
  * Removes a tab by its name.
  *
  * @param string tabName the name of the tab to be removed.
  * @return bool true on success, false on failure.
  */
	ui.removeInnerTab = function removeInnerTab(tabName) {
		if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
			document.querySelector('div[tab-name="' + tabName + '"]').remove();
			document.querySelector('#mb_' + tabName).remove();
			return true;
		}
		return false;
	};

	/**
  * Event handler that should be attatched to the div
  * holding the navigation for a tab set.
  *
  * @param eventArgs e
  * @return void
  */
	ui.changeTab = function changeTab(e) {
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

	document.querySelector('#navOverlay').addEventListener('click', ui.toggleMenu);
	document.querySelector('#mainNav').addEventListener('click', ui.globalTabChange);

	return ui;
}

/*global
	MessageBotCore,
	MessageBotUI
*/

function MessageBot() {
	//jshint ignore:line
	var bot = {
		devMode: false,
		core: MessageBotCore(),
		ui: MessageBotUI(),
		uMID: 0,
		version: '5.1.0',
		extensions: [],
		preferences: {},
		extensionURL: '//blockheadsfans.com/messagebot/extension/{id}/code/raw'
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
			bot.ui.alert('<p>Copy the following code to a safe place.<br>Size: ' + Object.keys(localStorage).reduce(function (c, l) {
				return c + l;
			}).length + ' bytes</p><p>' + bot.stripHTML(JSON.stringify(localStorage)) + '</p>');
		};

		/**
   * Method used to load a user's backup if possible.
   */
		bot.loadBackup = function loadBackup() {
			bot.ui.alert('Enter the backup code:<textarea style="width:99%;height:10em;"></textarea>', [{ text: 'Load backup & restart bot', style: 'success', action: function action() {
					var code = document.querySelector('#alert textarea').value;
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

					Object.keys(code).forEach(function (key) {
						localStorage.setItem(key, code[key]);
					});

					location.reload();
				} }, { text: 'Cancel' }]);
		};

		/**
   * Function used to save the bot preferences to the browser.
   */
		bot.savePrefs = function savePrefs() {
			var prefs = {};
			prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
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
			bot.core.addJoinListener('mb_join', 'bot', bot.onJoin.bind(bot));
			bot.core.addLeaveListener('mb_leave', 'bot', bot.onLeave.bind(bot));
			bot.core.addTriggerListener('mb_trigger', 'bot', bot.onTrigger.bind(bot));
			bot.core.addTriggerListener('mb_notify', 'bot', function (message) {
				if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
					bot.ui.notify(message.name + ': ' + message.message);
				}
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
			bot.ui.alert('Really delete this message?', [{ text: 'Delete', style: 'danger', thisArg: e.target.parentElement, action: function action() {
					this.remove();
					bot.saveConfig();
				} }, { text: 'Cancel' }]);
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
			bot.ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>', [{ text: 'Add', style: 'success', action: function action() {
					var extRef = document.querySelector('#alert input').value;
					if (extRef.length) {
						if (extRef.indexOf('http') === 0) {
							var el = document.createElement('script');
							el.src = extRef;
							document.head.appendChild(el);
						} else {
							bot.addExtension(extRef);
						}
					}
				} }, { text: 'Cancel' }]);
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
				Object.keys(window[extensionId].mainTabs).forEach(function (key) {
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
					setTimeout(function () {
						bot.textContent = 'Install';
					}.bind(button), 3000);
				}
			}
		};

		/**
   * Used to create and display a list of installed extensions that may not appear in the store.
   */
		bot.listExtensions = function listExtensions() {
			var el = document.getElementById('mb_ext_list');
			if (!bot.extensions.length) {
				el.innerHTML = '<p>No extensions installed</p>';
				return;
			}

			bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(bot.extensions) }).then(function (resp) {
				console.log('List Extensions: ', resp);
				if (resp.status == 'ok') {
					el.innerHTML = resp.extensions.reduce(function (html, ext) {
						return html + '<li>' + bot.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\');" class="button button-sm">Remove</a></li>';
					}, '<ul style="margin-left:1.5em;">') + '</ul>';
				} else {
					throw new Error(resp.message);
				}
			}).catch(function (err) {
				console.error(err);
				bot.core.addMessageToPage('<span style="color:#f00;">Fetching extension names failed with error: ' + bot.stripHTML(err.message) + '</span>', true);
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
			extId = extId || e.target.getAttribute('extension-id');
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
			bot.joinArr.forEach(function (msg) {
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
			bot.leaveArr.forEach(function (msg) {
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
			var triggerMatch = function triggerMatch(trigger, message) {
				if (bot.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			};
			bot.triggerArr.forEach(function (msg) {
				if (triggerMatch(msg.trigger, data.message) && bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {

					var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = bot.replaceAll(toSend, '{{ip}}', bot.core.getIP(data.name));
					bot.core.send(toSend);
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
			if (_typeof(bot.announcementArr[i]) == 'object') {
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
						saveObj.trigger = bot.preferences.disableTrim ? saveObj.trigger : saveObj.trigger.trim();
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
		var checkPref = function checkPref(type, name, defval) {
			if (_typeof(bot.preferences[name]) != type) {
				bot.preferences[name] = defval;
			}
		};
		var addListener = function addListener(selector, type, func) {
			var thisVal = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];

			document.querySelector(selector).addEventListener(type, func.bind(thisVal));
		};

		var str = localStorage.getItem('mb_preferences');
		bot.preferences = str === null ? {} : JSON.parse(str);
		checkPref('number', 'announcementDelay', 10);
		checkPref('boolean', 'regexTriggers', false);
		checkPref('boolean', 'disableTrim', false);
		checkPref('boolean', 'notify', true);

		bot.fixTemplates();

		var addMsgElems = document.querySelectorAll('span.add');
		for (var i = 0; i < addMsgElems.length; i++) {
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
		document.querySelector('#mb_regex_triggers').checked = bot.preferences.regexTriggers ? 'checked' : '';
		document.querySelector('#mb_disable_trim').checked = bot.preferences.disableTrim ? 'checked' : '';
		document.querySelector('#mb_notify_message').checked = bot.preferences.notify ? 'checked' : '';
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
			bot.addExtension(ext);
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

	//Initialize the store page
	bot.core.ajax.getJSON('//blockheadsfans.com/messagebot/extension/store').then(function (data) {
		console.log(data);
		var content = document.getElementById('extTemplate').content;

		if (data.status == 'ok') {
			data.extensions.forEach(function (extension) {
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
	}).catch(function (err) {
		console.error(err);
	});

	return bot;
}

function MessageBotExtension(namespace) {
	//jshint ignore:line
	var extension = {
		id: namespace,
		bot: window.bot,
		core: window.bot.core,
		ui: window.bot.ui,
		settingsTab: null,
		mainTabs: {}
	};

	/**
  * DEPRICATED. Will be removed next minor version. Use addTab instead.
  *
  * @param string tabText the text to display on the tab
  * @return void
  */
	extension.addSettingsTab = function addSettingsTab(tabText) {
		console.warn('addSettingsTab has been depricated. Use addTab(tabText, tabId) instead.');
		this.ui.addTab(tabText, 'settings_' + this.id);
		this.settingsTab = document.querySelector('#mb_settings_' + this.id);
	};

	/**
  * DEPRICATED. Will be removed next minor version. Use addTab instead.
  *
  * @param string tabId the ID of the tab to add
  * @param string tabText the text which to place on the tab
  * @return void
  */
	extension.addMainTab = function addMainTab(tabId, tabText) {
		console.warn('addMainTab has been depricated. Use addTab(tabText, tabId, "msgs_tabs") instead.');
		this.ui.addTab(tabText, 'main_' + this.id + '_' + tabId, 'msgs');
		this.mainTabs[tabId] = document.querySelector('#mb_main_' + this.id + '_' + tabId);
	};

	/**
  * Used to add a tab to the bot's navigation.
  *
  * @param string tabText
  * @param string tabId
  * @param string tabGroup optional CSS selector that the tab should be added to.
  * @return void
  */
	extension.addTab = function addTab(tabText, tabId) {
		var tabGroup = arguments.length <= 2 || arguments[2] === undefined ? '#mainNavContents' : arguments[2];

		this.ui.addTab(tabText, this.id + '_' + tabId, tabGroup);
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
		return this.core.addJoinListener(this.id + '_' + uniqueId, this.id, this.id, listener);
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

/*global
    MessageBot
*/

var bot = MessageBot();
bot.start();

window.addEventListener('error', function (err) {
	//Wrap everything here in a try catch so that errors with our error reporting don't generate more errors to be reported... infinite loop.
	try {
		if (!bot.devMode) {
			if (err.message == 'Script error') {
				bot.ui.notify('Your bookmark is likely outdated, unable to report error.');
				return;
			}
			console.info('Reporting error:', err);
			bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error', {
				world_name: bot.core.worldName,
				world_id: window.worldId,
				owner_name: bot.core.ownerName,
				bot_version: bot.version,
				error_text: err.message,
				error_file: err.filename,
				error_row: err.lineno,
				error_column: err.colno
			}).then(function (resp) {
				if (resp.status == 'ok') {
					bot.ui.notify('Something went wrong, it has been reported.');
				} else {
					throw new Error(resp.message);
				}
			}).catch(function (err) {
				console.error(err);
				bot.ui.notify('Error reporting exception: ' + err);
			});
		}
	} catch (e) {
		console.error(e);
	}
});