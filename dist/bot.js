'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

if (document.querySelector('script[crossorigin="true"]') === null) {
	void 0;
	location.assign('http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=309090&viewfull=1#post309090');
}

window.pollChat = function () {};

var bot = {};

window.onerror = function (text, file, line, column) {
	if (!bot.devMode && text != 'Script error.') {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?version= ' + bot.version + '&wId=' + encodeURIComponent(window.worldId) + '&wName=' + encodeURIComponent(bot.core.worldName) + '&text=' + encodeURIComponent(text) + '&file=' + encodeURIComponent(file) + '&line=' + line + '&col=' + (column || 0); 
		document.head.appendChild(sc);
	}
};

function MessageBotCore() {
	if (!document.getElementById('messageText')) {
		void 0;
		throw new Error("Not a console page. Opened at:" + document.location.href);
	}

	document.head.innerHTML += '<style>.admin > span:first-child { color: #0007CF} .mod > span:first-child { color: #08C738}</style>';
	document.getElementById('messageButton').setAttribute('onclick', 'return bot.core.userSend(bot.core);');
	document.getElementById('messageText').setAttribute('onkeydown', 'bot.core.enterCheck(event, bot.core)');

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

	{
		core.send = function send(message) {
			core.toSend.push(message);
		};

		core.postMessage = function postMessage() {
			var _this = this;

			if (this.toSend.length > 0) {
				var tmpMsg = this.toSend.shift();
				Object.keys(this.sendChecks).forEach(function (key) {
					if (tmpMsg) {
						tmpMsg = _this.sendChecks[key](tmpMsg);
					}
				});
				if (tmpMsg) {
					this.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg });
				}
			}
			setTimeout(this.postMessage.bind(this), this.sendDelay);
		};

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
					core.addMessageToPage('<span style="color:#f00;">Sending error: ' + error + '</span>', true);
				}).then(function () {
					core.scrollToBottom();
				});
			} else {
				button.textContent = 'CANCELED';
			}
		};

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

	{
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
			}).catch(function (error) {
				core.addMessageToPage('<span style="color:#f00;">Error: ' + error + '.</span>', true);
			});
		};

		core.scrollToBottom = function scrollToBottom() {
			var el = document.querySelector('#mb_console > div > ul');
			el.scrollTop = el.scrollHeight - el.scrollTop;
		};

		core.parseMessage = function parseMessage(message) {
			var _this2 = this;

			var getUserName = function getUserName(message) {
				for (var i = 18; i > 4; i--) {
					var possibleName = message.substring(0, message.lastIndexOf(': ', i));
					if (_this2.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
						return { name: possibleName, safe: true };
					}
				}
				return { name: message.substring(0, message.lastIndexOf(': ', 18)), safe: false };
			};

			if (message.indexOf(this.worldName + ' - Player Connected ') === 0) {
				(function () {
					_this2.addMessageToPage(message);

					var name = message.substring(_this2.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
					var ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

					if (_this2.players.hasOwnProperty(name)) {
						_this2.players[name].joins++;
					} else {
						_this2.players[name] = {};
						_this2.players[name].joins = 1;
						_this2.players[name].ips = [];
					}
					_this2.players[name].ip = ip;
					_this2.online.push(name);

					Object.keys(_this2.joinFuncs).forEach(function (key) {
						_this2.joinFuncs[key]({ name: name, ip: ip });
					});
				})();
			} else if (message.indexOf(this.worldName + ' - Player Disconnected ') === 0) {
				var playerIn;

				(function () {
					_this2.addMessageToPage(message);

					var name = message.substring(_this2.worldName.length + 23);
					var ip = _this2.getIP(name);
					playerIn = _this2.online.indexOf(name);

					if (playerIn > -1) {
						_this2.online.splice(name, 1);
					}

					Object.keys(_this2.leaveFuncs).forEach(function (key) {
						_this2.leaveFuncs[key]({ name: name, ip: ip });
					});
				})();
			} else if (message.indexOf(': ') >= 0) {
				var messageData = getUserName(message);
				messageData.message = message.substring(messageData.name.length + 2);
				this.addMessageToPage(messageData);

				if (messageData.name == 'SERVER') {
					Object.keys(this.serverFuncs).forEach(function (key) {
						_this2.serverFuncs[key](messageData);
					});
				} else {
					Object.keys(this.triggerFuncs).forEach(function (key) {
						_this2.triggerFuncs[key](messageData);
					});
				}
			} else {
				this.addMessageToPage(message);
				Object.keys(this.otherFuncs).forEach(function (key) {
					_this2.otherFuncs[key](message);
				});
			}
		};
	}

	{
		core.addMessageToPage = function addMessageToPage(msg) {
			var html = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

			var msgEl = document.createElement('li');

			if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) == 'object') {
				if (this.staffList.indexOf(msg.name) > -1) {
					msgEl.setAttribute('class', this.adminList.indexOf(msg.name) > -1 ? 'admin' : 'mod');
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
			this.chatId = window.chatId < 20 ? 0 : window.chatId - 20;
			this.pollChat(this);
			this.listening = true;
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

	core.ajax = function () {
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

		function get() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return xhr('GET', url, paramObj);
		}

		function getJSON() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return get(url, paramObj).then(JSON.parse);
		}

		function post() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return xhr('POST', url, paramObj);
		}

		function postJSON() {
			var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
			var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return post(url, paramObj).then(JSON.parse);
		}

		return { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };
	}();

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
		var s = document.createElement('script');
		s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(core.ownerName) + '&id=' + window.worldId + '&world=' + encodeURIComponent(core.worldName);
		document.head.appendChild(s);
	});

	core.postMessage();

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

function MessageBotUI() {
	document.head.innerHTML = '<title>Console</title> <meta name="viewport" content="width=device-width,initial-scale=1">';
	document.head.innerHTML += '<style>body,html{min-height:100vh;position:relative;width:100%;margin:0}a{cursor:pointer;color:#182b73}#container>div:not(#header){display:none;padding:10px}#container>div.visible:not(#header),#mainNav{display:block}.overlay{position:fixed;top:0;left:0;bottom:0;right:0;opacity:0;visibility:hidden;z-index:8999;background:rgba(0,0,0,.6);transition:opacity .5s}#mainNav,#mainToggle{color:#fff;position:absolute;z-index:9999}#header{height:80px;width:100%;background:url(http://portal.theblockheads.net/static/images/portalHeader.png) 50px 0 no-repeat #051465}#mainNav{background:#182b73;padding-bottom:50px;width:250px;top:0;left:-250px;bottom:0;transition:left .5s;overflow:auto;-webkit-overflow-scrolling:touch}#toggle{display:none}#mainToggle{background:rgba(255,255,255,.2);padding:5px;top:5px;left:5px;opacity:1;transition:left .5s,opacity .5s}.tab,.tab-header{display:block;padding:10px 0;text-align:center}.tab,.tab-group{border-bottom:1px solid rgba(255,255,255,.2)}.tab-body>.tab{border-bottom:1px solid #182B73}.tab.selected{background:radial-gradient(#7D88B3,#182B73)}.tab-body>.tab.selected{background:radial-gradient(#182B73,#7D88B3)}.tab-header-toggle{display:none}.tab-header{padding:10px 0 5px;display:block;text-align:center}.tab-body{background:rgba(255,255,255,.2);border-radius:10px;width:80%;margin-left:10%}.tab-header-toggle~.tab-body{overflow:hidden;max-height:0;margin-bottom:5px;transition:.5s cubic-bezier(0,1,.5,1)}.tab-header-toggle~.tab-header:after{font-size:50%;content:"▼";position:relative;top:-.25em;left:.5em}.tab-header-toggle:checked~.tab-body{display:block;transition:.5s ease-in;max-height:1000px;overflow:hidden}.tab-header-toggle:checked~.tab-header:after{content:"▲"}#mb_console>div:nth-child(1){height:calc(100vh - 220px)}@media screen and (min-width:668px){#mb_console>div:nth-child(1){height:calc(100vh - 150px)}}#mb_console>div>ul{height:100%;overflow-y:auto;width:100%;margin:0;padding:0}.mod>span:first-child{color:#05f529}.admin>span:first-child{color:#2b26bd}#mb_console>div:nth-child(2){display:flex}#mb_console button,#mb_console input{padding:5px;font-size:1em;margin:5px 0}#mb_console input{flex:1;border:1px solid #999}#mb_console button{background-color:#182b73;font-weight:700;color:#fff;border:0;height:40px}#toggle:checked~#mainToggle{left:255px;opacity:0;transition:left .5s,opacity .5s}#toggle:checked~#navOverlay{visibility:visible;opacity:1}#toggle:checked~#mainNav{left:0;transition:left .5s}#alert{visibility:hidden;position:fixed;left:0;right:0;top:50px;margin:auto;background:#fff;width:50%;border-radius:10px;padding:10px 10px 55px;min-width:300px;min-height:200px;z-index:8000}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span,.button{display:inline-block;padding:6px 12px;margin:0 5px;font-size:14px;line-height:1.428571429;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;border:1px solid rgba(0,0,0,.15);border-radius:4px}.button{background:linear-gradient(to bottom,#fff 0,#e0e0e0 100%) #fff}#alert>.buttons>span:not([class=""]),.danger,.info,.success,.warning{color:#fff}.success{background:linear-gradient(to bottom,#5cb85c 0,#419641 100%) #5cb85c;border-color:#3e8f3e}.info{background:linear-gradient(to bottom,#5bc0de 0,#2aabd2 100%) #5bc0de;border-color:#28a4c9}.danger{background:linear-gradient(to bottom,#d9534f 0,#c12e2a 100%) #d9534f;border-color:#b92c28}.warning{background:linear-gradient(to bottom,#f0ad4e 0,#eb9316 100%) #f0ad4e;border-color:#e38d13}#alertOverlay{z-index:7999}#alert.visible,#alertOverlay.visible{visibility:visible;opacity:1}.notification{color:#fff;position:fixed;top:1em;right:1em;opacity:0;min-width:200px;border-radius:5px;background:#051465;padding:5px;transition:opacity 2s}.notification.visible{opacity:1}.ext,.msg{position:relative;width:calc(33% - 19px);min-width:280px;margin-left:5px;margin-bottom:5px;border:3px solid #878787;border-radius:10px;float:left;padding:5px}.ext:nth-child(odd),.msg:nth-child(odd){background:#C6C6C6}.msg>input{width:calc(100% - 10px);border:2px solid #666}.msg>input[type=number]{width:5em}.descgen{margin:0 0 5px}#mb_load_man,.add{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:90px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}#mb_load_man{width:inherit;padding:0 7px}#aMsgs,#exts,#jMsgs,#lMsgs,#tMsgs{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 165px)}.ext{height:120px}.ext>h4{margin:0}.ext>button{position:absolute;bottom:7px;padding:3px 8px}.tabContainer>div{display:none;min-height:calc(100vh - 175px)}.tabContainer>div.visible{display:block}.botTabs{width:100%;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-flow:row wrap;flex-flow:row wrap}.botTabs>div{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;-webkit-flex-grow:1;flex-grow:1;height:40px;margin-top:5px;margin-right:5px;min-width:120px;background:#182B73;color:#FFF;font-family:"Lucida Grande","Lucida Sans Unicode",sans-serif}.botTabs>div:last-child{margin-right:0}.botTabs>div.selected{color:#000;background:#E7E7E7}<style>';
	document.body.innerHTML = '<input type="checkbox" name="menu" id="toggle"> <label for="toggle" id="mainToggle">&#9776; Menu</label> <nav id="mainNav"> <div id="mainNavContents"> <span class="tab selected" g-tab-name="console">CONSOLE</span> <div class="tab-group"> <input type="checkbox" name="group_msgs" id="group_msgs" class="tab-header-toggle"> <label class="tab-header" for="group_msgs">MESSAGES</label> <div class="tab-body" id="msgs_tabs"> <span class="tab" g-tab-name="join">JOIN</span> <span class="tab" g-tab-name="leave">LEAVE</span> <span class="tab" g-tab-name="trigger">TRIGGER</span> <span class="tab" g-tab-name="announcements">ANNOUNCEMENTS</span> </div> </div> <span class="tab" g-tab-name="extensions">EXTENSIONS</span> <span class="tab" g-tab-name="settings">SETTINGS</span> </div> <div class="clearfix"></div> </nav> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <input class="m"> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <input class="m"> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Say:</label> <input class="m"> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button class="button">Install</button> </div> </template> </div> <div id="navOverlay" class="overlay"></div> <div id="container"> <div id="header" class="visible"></div> <div id="mb_console" class="visible"> <div><ul></ul></div> <div><input type="text"><button>SEND</button></div> </div> <div id="mb_join"> <h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave"> <h3 class="descgen">These are checked when a player leaves the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger"> <h3 class="descgen">These are checked whenever someone says something.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements"> <h3 class="descgen">These are sent according to a regular schedule.</h3> <span class="descdet">If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> <div id="mb_extensions"> <h3 class="descgen">Extensions can increase the functionality of the bot.</h3> <span class="descdet">Interested in creating one? <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki" target="_blank">Click here.</a></span> <span id="mb_load_man">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings"> <h3>Settings</h3> <label for="mb_ann_delay">Delay between announcements (minutes): </label> <input id="mb_ann_delay" type="number"><br> <label for="mb_notify_message">Notification on new chat when not on console page: </label> <input id="mb_notify_message" type="checkbox"><br> <h3>Advanced Settings</h3> <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options" target="_blank">Read this first</a> <label for="mb_regex_triggers">Parse triggers as RegEx: </label> <input id="mb_regex_triggers" type="checkbox"><br> <label for="mb_disable_trim">Disable whitespace trimming: </label> <input id="mb_disable_trim" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> <div id="alert"> <div></div> <div class="buttons"> </div> </div> <div id="alertOverlay" class="overlay"></div>';

	var mainToggle = document.querySelector('#toggle');

	var ui = {
		alertActive: false,
		alertQueue: [],
		alertButtons: {}
	};

	ui.alert = function (text) {
		var buttons = arguments.length <= 1 || arguments[1] === undefined ? [{ text: 'OK' }] : arguments[1];

		function buildButton(ui, button) {
			var el = document.createElement('span');
			el.innerHTML = button.text;
			el.setAttribute('class', button.style || '');
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
			button.dismiss = button.dismiss === false ? false : true; 
			ui.alertButtons['button_' + i] = { action: button.action, thisArg: button.thisArg, dismiss: button.dismiss };
			button.id = 'button_' + i;
			buildButton(this, button);
		}.bind(this));
		document.querySelector('#alert > div').innerHTML = text;

		document.querySelector('#alertOverlay').classList.toggle('visible');
		document.querySelector('#alert').classList.toggle('visible');
	};

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

	ui.buttonHandler = function (event) {
		var alertButton = ui.alertButtons[event.target.id] || {};
		alertButton.thisArg = alertButton.thisArg || undefined;
		alertButton.dismiss = typeof alertButton.dismiss == 'boolean' ? alertButton.dismiss : true;
		if (typeof alertButton.action == 'function') {
			alertButton.action.call(alertButton.thisArg);
		}
		if (alertButton.dismiss || typeof alertButton.action != 'function') {
			document.querySelector('#alert').classList.toggle('visible');
			document.querySelector('#alertOverlay').classList.toggle('visible');
			document.querySelector('#alert > .buttons').innerHTML = '';
			ui.alertButtons = {};
			ui.alertActive = false;
			ui.checkAlertQueue();
		}
	};

	ui.checkAlertQueue = function () {
		if (ui.alertQueue.length) {
			var _alert = ui.alertQueue.shift();
			ui.alert(_alert.text, _alert.buttons);
		}
	};

	ui.globalTabChange = function (event) {
		if (event.target.getAttribute('g-tab-name') !== null) {
			Array.from(document.querySelectorAll('div.visible:not(#header)')).forEach(function (el) {
				return el.classList.remove('visible');
			}); 
			document.querySelector('#mb_' + event.target.getAttribute('g-tab-name')).classList.add('visible');
			document.querySelector('span.tab.selected').classList.remove('selected');
			event.target.classList.add('selected');
		}
	};

	ui.toggleMenu = function () {
		mainToggle.checked = !mainToggle.checked;
	};

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

	ui.removeInnerTab = function removeInnerTab(tabName) {
		if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
			document.querySelector('div[tab-name="' + tabName + '"]').remove();
			document.querySelector('#mb_' + tabName).remove();
			return true;
		}
		return false;
	};

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


function MessageBot() {
	var bot = {
		devMode: true,
		core: MessageBotCore(),
		ui: MessageBotUI(),
		uMID: 0,
		version: '5.1.0',
		extensions: [],
		preferences: {},
		extensionURL: '//localhost/messagebot/extension/{id}/code/raw'
	};

	{
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

		bot.generateBackup = function generateBackup() {
			bot.ui.alert('<p>Copy the following code to a safe place.<br>Size: ' + Object.keys(localStorage).reduce(function (c, l) {
				return c + l;
			}).length + ' bytes</p><p>' + bot.stripHTML(JSON.stringify(localStorage)) + '</p>');
		};

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

		bot.savePrefs = function savePrefs() {
			var prefs = {};
			prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
			prefs.regexTriggers = document.querySelector('#mb_regex_triggers').checked;
			prefs.disableTrim = document.querySelector('#mb_disable_trim').checked;
			prefs.notify = document.querySelector('#mb_notify_message').checked;
			this.preferences = prefs;
			localStorage.setItem('mb_preferences', JSON.stringify(prefs));
		};
	}

	{
		bot.start = function start() {
			var _this5 = this;

			this.core.addJoinListener('mb_join', this.onJoin.bind(this));
			this.core.addLeaveListener('mb_leave', this.onLeave.bind(this));
			this.core.addTriggerListener('mb_trigger', this.onTrigger.bind(this));
			this.core.addTriggerListener('mb_notify', function (message) {
				if (_this5.preferences.notify) {
					_this5.ui.notify(message.name + ': ' + message.message);
				}
			});
			this.announcementCheck(0);
			this.core.startListening();
		};

		bot.addTab = function addTab(navID, contentID, tabName, tabText) {
			void 0;
			bot.ui.addInnerTab(navID, contentID, tabName, tabText);
		};

		bot.removeTab = function removeTab(tabName) {
			void 0;
			bot.ui.removeInnerTab(tabName);
		};

		bot.changeTab = function changeTab(e) {
			void 0;
			bot.ui.changeTab(e);
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
			bot.ui.alert('Really delete this message?', [{ text: 'Delete', style: 'danger', thisArg: e.target.parentElement, action: function action() {
					this.remove();
					bot.saveConfig();
				} }, { text: 'Cancel' }]);
			e.stopPropagation();
		};
	}

	{
		bot.initStore = function initStore(data) {
			var _this6 = this;

			var content = document.getElementById('extTemplate').content;

			if (data.status == 'ok') {
				data.extensions.forEach(function (extension) {
					content.querySelector('h4').textContent = extension.title;
					content.querySelector('span').innerHTML = extension.snippet;
					content.querySelector('.ext').setAttribute('extension-id', extension.id);
					content.querySelector('button').textContent = _this6.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

					document.getElementById('exts').appendChild(document.importNode(content, true));
				});
			} else {
				document.getElementById('exts').innerHTML += 'Error: Unable to fetch data from the extension server.';
			}

			this.listExtensions();
		};

		bot.addExtension = function addExtension(extensionId) {
			var el = document.createElement('script');
			el.src = this.extensionURL.replace('{id}', extensionId);
			el.crossOrigin = 'anonymous';
			document.body.appendChild(el);
		};

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

		bot.removeExtension = function removeExtension(extensionId) {
			var _this7 = this;

			if (typeof window[extensionId] != 'undefined') {
				if (typeof window[extensionId].uninstall == 'function') {
					window[extensionId].uninstall();
				}

				this.ui.removeTab('settings_' + extensionId);
				Object.keys(window[extensionId].mainTabs).forEach(function (key) {
					_this7.removeTab('main_' + extensionId + '_' + key);
				});
				window[extensionId] = undefined;
			}
			var extIn = this.extensions.indexOf(extensionId);
			if (extIn > -1) {
				this.extensions.splice(extIn, 1);
				this.saveConfig();

				this.listExtensions();

				var button = document.querySelector('div[extension-id=' + extensionId + '] > button');
				if (button !== null) {
					button.textContent = 'Removed';
					setTimeout(function () {
						this.textContent = 'Install';
					}.bind(button), 3000);
				}
			}
		};

		bot.listExtensions = function listExtensions() {
			var _this8 = this;

			var el = document.getElementById('mb_ext_list');
			if (!this.extensions.length) {
				el.innerHTML = '<p>No extensions installed</p>';
				return;
			}

			this.core.ajax.postJSON('http://blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(this.extensions) }).then(function (extensions) {
				el.innerHTML = extensions.reduce(function (ext) {
					return '<li>' + _this8.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\')">Remove</a></li>';
				}, '<ul style="margin-left:1.5em;">') + '</ul>';
			}).catch(function (err) {
				void 0;
				_this8.core.addMessageToPage('<span style="color:#f00;">Fetching extension names failed with error: ' + _this8.stripHTML(err.message) + '</span>', true);
				el.innerHTML = 'Error fetching extension names';
			});
		};

		bot.setAutoLaunch = function setAutoLaunch(extensionId, autoLaunch) {
			if (this.extensions.indexOf(extensionId) < 0 && autoLaunch) {
				this.extensions.push(extensionId);
				bot.listExtensions();
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

	{
		bot.onJoin = function onJoin(data) {
			var _this9 = this;

			this.joinArr.forEach(function (msg) {
				if (_this9.checkGroup(msg.group, data.name) && !_this9.checkGroup(msg.not_group, data.name) && _this9.checkJoins(msg.joins_low, msg.joins_high, _this9.core.getJoins(data.name))) {
					var toSend = _this9.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this9.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this9.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this9.replaceAll(toSend, '{{ip}}', data.ip);
					_this9.core.send(toSend);
				}
			});
		};

		bot.onLeave = function onLeave(data) {
			var _this10 = this;

			this.leaveArr.forEach(function (msg) {
				if (_this10.checkGroup(msg.group, data.name) && !_this10.checkGroup(msg.not_group, data.name) && _this10.checkJoins(msg.joins_low, msg.joins_high, _this10.core.getJoins(data.name))) {
					var toSend = _this10.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this10.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this10.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this10.replaceAll(toSend, '{{ip}}', data.ip);
					_this10.core.send(toSend);
				}
			});
		};

		bot.onTrigger = function onTrigger(data) {
			var _this11 = this;

			var triggerMatch = function triggerMatch(trigger, message) {
				if (_this11.preferences.regexTriggers) {
					return new RegExp(trigger, 'i').test(message);
				}
				return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
			};
			this.triggerArr.forEach(function (msg) {
				if (triggerMatch(msg.trigger, data.message) && _this11.checkGroup(msg.group, data.name) && !_this11.checkGroup(msg.not_group, data.name) && _this11.checkJoins(msg.joins_low, msg.joins_high, _this11.core.getJoins(data.name))) {

					var toSend = _this11.replaceAll(msg.message, '{{NAME}}', data.name);
					toSend = _this11.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
					toSend = _this11.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
					toSend = _this11.replaceAll(toSend, '{{ip}}', _this11.core.getIP(data.name));
					_this11.core.send(toSend);
				}
			});
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
			container.appendChild(document.importNode(content, true));

			if (template.id != 'aTemplate') {
				var selects = document.querySelectorAll('#m' + this.uMID + ' > select');

				selects[0].value = saveObj.group || 'All';

				selects[1].value = saveObj.not_group || 'Nobody';
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

		document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
		document.querySelector('#mb_regex_triggers').checked = bot.preferences.regexTriggers ? 'checked' : '';
		document.querySelector('#mb_disable_trim').checked = bot.preferences.disableTrim ? 'checked' : '';
		document.querySelector('#mb_notify_message').checked = bot.preferences.notify ? 'checked' : '';
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

	(function () {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/store.php?callback=bot.initStore';
		sc.crossOrigin = 'anonymous';
		document.head.appendChild(sc);
	})();

	return bot;
}

function MessageBotExtension(namespace) {
	if (this instanceof MessageBotExtension) {
		void 0;
		window.bot.removeExtension(namespace);
		throw new Error('Outdated extension, ID:' + namespace, 0, 0);
	}

	var extension = {
		id: namespace,
		bot: window.bot,
		core: window.bot.core,
		ui: window.bot.ui,
		settingsTab: null,
		mainTabs: {}
	};

	extension.addSettingsTab = function addSettingsTab(tabText) {
		void 0;
		this.ui.addTab(tabText, 'settings_' + this.id);
		this.settingsTab = document.querySelector('#mb_settings_' + this.id);
	};

	extension.addMainTab = function addMainTab(tabId, tabText) {
		void 0;
		this.ui.addTab(tabText, 'main_' + this.id + '_' + tabId, 'msgs');
		this.mainTabs[tabId] = document.querySelector('#mb_main_' + this.id + '_' + tabId);
	};

	extension.addTab = function addTab(tabText, tabId) {
		var tabGroup = arguments.length <= 2 || arguments[2] === undefined ? '#mainNavContents' : arguments[2];

		this.ui.addTab(tabText, this.id + '_' + tabId, tabGroup);
	};

	extension.addTabGroup = function addTabGroup(tabText, tabId) {
		this.ui.addTabGroup(tabText, this.id + '_' + tabId);
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

bot = MessageBot();
bot.start();
