/*jshint
	browser:	true,
	devel:		true
*/
/*global
	ajaxJson
*/

function MessageBotCore() {
	//Avoid trying to launch the bot on a non-console page.
	if (!document.getElementById('messageText')) {
		alert('Please start a server and navigate to the console page before starting the bot.');
	}
	
	//For colored chat
	document.styleSheets[0].insertRule('.admin > span:first-child { color: #0007CF}', 0);
	document.styleSheets[0].insertRule('.mod > span:first-child { color: #08C738}', 0);
	//We are replacing these with our own functions.
	document.getElementById('messageButton').setAttribute('onclick', 'return bot.core.userSend(bot.core);');
	document.getElementById('messageText').setAttribute('onkeydown',  'bot.core.enterCheck(event, bot.core)');
	
	//Only needs to be run once, thus no need to keep a reference, fixes setTimeout on IE 9
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
				chatMsgMaxCount: 999
			   };

	core.worldName = document.title.substring(0, document.title.indexOf('Manager | Portal') - 1);
	core.ownerName = document.getElementById('nav_profile').textContent;
	core.chatId = window.chatId;

	//Set some of the default values
	
	//Get the player list
	(function(core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = (function() {
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
	}(core));
	
	//Get online players
	(function(core) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			var doc = (new DOMParser()).parseFromString(xhr.responseText, 'text/html');
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
	
	//Define all of our functions that will be availible to the user
	
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
	 * @param EventArgs e
	 * @param MessageBotCore t
	 */
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
	
	/*
	 * Adds a message to the console, expects this to be assigned to the core
	 * 
	 * @param string|object Either an object with properties name and message, or a string
	 * @return void
	 */
	core.addMsgToPage = function addMsgToPage(msg) {
		var elclass = '';
		var chatEl = document.getElementById('chatBox');
		if (chatEl.children.length > this.chatMsgMaxCount) {
			chatEl.removeChild(chatEl.childNodes[0]);    
		}
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
			msgEl.textContent = msg;
		}
		var chat = document.getElementById('chat');
		var position = chatEl.scrollHeight - chatEl.scrollTop;
		chat.appendChild(contEl);
		
		if (position <= 310) {
			chatEl.scrollTop = chatEl.scrollHeight;
		}
			
	};
	
	//Interacting with player data
	
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
	
	//Controlling the core
	/**
	 * Method used to tell the bot to start listening to chat
	 *
	 * @return void
	 */
	core.startListening = function startListening() {
		this.chatId = window.chatId;
		this.pollChat(this);
		this.listening = true;
		this._shouldListen = true;
	};
	
	/**
	 * Method used to tell the bot to stop listening to chat
	 */
	core.stopListening = function stopListening() {
		this._shouldListen = false;
	};
	
	//Listener control functions
	
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
	
	//Internal methods
	
	/* 
	 * Internal method. Use startListening and stopListening to control this function.
	 *
	 * @param MessageBotCore core a reference to the core.
	 * @return void
	 */
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
	
	/**
	 * Internal method. Used to check if the server has come back online 
	 * after going offline due to no players. If the server is online the 
	 * bot will start polling chat again. If not, it checks again later.
	 */
	core.checkOnline = function checkOnline(core) {
		ajaxJson({ command: 'status', worldId: window.worldId }, function (data) {
			if (data.worldStatus == 'online') {
				core.startListening();
			} else {
				setTimeout(core.checkOnline, core.checkOnlineWait, core);
			}
		}, window.apiURL);
	};
	
	/** 
	 * Used to parse messages recieved from the server into objects which can be used. Also calls appropriate listeners. 
	 */
	core.parseMessage = function parseMessage(message) {
		function getUserName(message, core) {
			for (var i = 18; i > 4; i--) {
				var possibleName = message.substring(0, message.lastIndexOf(': ', i));
				if (core.online.indexOf(possibleName) >= 0) {
					return { name: possibleName, safe: true };
				}
			}
			//The user is not in our online list. Use the old substring method without checking that the user is online
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

			Object.keys(this.joinFuncs).forEach((function (key) {
				this.joinFuncs[key]({ name: name, ip: ip });
			}).bind(this));
		} else if (message.indexOf(this.worldName + ' - Player Disconnected ') === 0) {
			this.addMsgToPage(message);
			
			name = message.substring(this.worldName.length + 23);
			ip = this.getIP(name);
			//Remove the user from the online list.
			var playerIn = this.online.indexOf(name);
			if (playerIn > -1) {
				this.online.splice(name, 1);
			}

			Object.keys(this.leaveFuncs).forEach((function (key) {
				this.leaveFuncs[key]({ name: name, ip: ip });
			}).bind(this));
		} else if (message.indexOf(': ') >= 0) {
			//A chat message - server or player?
			var messageData = getUserName(message, this);
			messageData.message = message.substring(messageData.name.length + 2);
			this.addMsgToPage(messageData);
			//messageData resembles this:
			//	{name:"ABC123", message:"Hello there!", safe:true}

			//Handle people being added or removed from staff
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
				//Server message
				Object.keys(this.serverFuncs).forEach((function (key) {
					this.serverFuncs[key](messageData);
				}).bind(this));
			} else {
				//Regular player message
				Object.keys(this.triggerFuncs).forEach((function (key) {
					this.triggerFuncs[key](messageData);
				}).bind(this));
			}
		} else {
			this.addMsgToPage(message);
			Object.keys(this.otherFuncs).forEach((function (key) {
				this.otherFuncs[key](message);
			}).bind(this));
		}
	};
	
	//Start listening for messages to send
	core.postMessageReference = setInterval(function postMessage() {
		if (this.toSend.length > 0) {
			var tmpMsg = this.toSend.shift();
			Object.keys(this.sendChecks).forEach((function (key) {
				if (tmpMsg) {
					tmpMsg = this.sendChecks[key](tmpMsg);
				}
			}).bind(this));
			if (tmpMsg) {
				ajaxJson({ command: 'send', worldId: window.worldId, message: tmpMsg }, undefined, window.apiURL);
			}
		}
	}.bind(core), 1000);
	
	return core;
}