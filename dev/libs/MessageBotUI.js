(function() {
    var ui = function(hook, bhfansapi) { //jshint ignore:line
        var uniqueMessageID = 0;

        function listenerHook(selector, type, hookname) {
            document.querySelector(selector)
                .addEventListener(type, () => hook.check(`ui.${hookname}`));
        }

        document.head.innerHTML = '{{inject ../dist/tmphead.html}}';
        document.head.innerHTML += '<style>{{inject ../dist/tmpbot.css}}<style>';
        document.body.innerHTML = '{{inject ../dist/tmpbody.html}}';

        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'].forEach((id) => {
            listenerHook(`#${id}`, 'change', 'messageChanged');
        });
        listenerHook('#mb_settings', 'change', 'prefChanged');

        //Auto scrolls to the latest chat message, if the owner isn't reading old chat.
        hook.listen('ui.addmessagetopage', function showNewChat() {
            let container = document.querySelector('#mb_console ul');
            let lastLine = document.querySelector('#mb_console li:last-child');

            if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        });

        //Avoids the size of the page growing unboundedly
        hook.listen('ui.addmessagetopage', function removeOldChat() {
            var chat = document.querySelector('#mb_console ul');

            while (chat.children.length > 500) {
                chat.children[0].remove();
            }
        });

        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            var extId = e.target.parentElement.getAttribute('extension-id');
            //Handle clicks on the div itself, not a child elem
            extId = extId  || e.target.getAttribute('extension-id');
            var button = document.querySelector('div[extension-id="' + extId + '"] > button');
            if (e.target.tagName == 'BUTTON') {
                if (e.target.textContent == 'Install') {
                    bhfansapi.startExtension(extId);
                    button.textContent = 'Remove';
                } else {
                    bhfansapi.removeExtension(extId);

                    window[extId] = undefined;
                }
            }
        });

        if (!('content' in document.createElement('template'))) {
            let qPlates = document.getElementsByTagName('template'),
                plateLen = qPlates.length,
                elPlate,
                qContent,
                contentLen,
                docContent;

            for (let x = 0; x < plateLen; ++x) {
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

        bhfansapi.getStore().then(resp => {
            if (resp.status != 'ok') {
                bhfansapi.reportError(resp.message);
                document.getElementById('exts').innerHTML += resp.message;
                return;
            }
            resp.extensions.forEach(extension => {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [
                    {selector: 'h4', text: extension.title},
                    {selector: 'span', html: extension.snippet},
                    {selector: '.ext', 'extension-id': extension.id},
                    {selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install'}
                ]);
            });
        });


        var mainToggle = document.querySelector('#toggle');

        // Used by the user to add new messages
        function addEmptyMsg(e) {
            var containerElem = e.target.parentElement.querySelector('div');
            var template;

            switch (containerElem.id) {
                case 'jMsgs':
                case 'lMsgs':
                    template = document.getElementById('jlTemplate');
                    break;
                case 'tMsgs':
                    template = document.getElementById('tTemplate');
                    break;
                default:
                    template = document.getElementById('aTemplate');
            }

            ui.addMsg(containerElem, template, {});

            e.stopPropagation();
        }

        Array.from(document.querySelectorAll('span.add')).forEach((el) => {
            el.addEventListener('click', addEmptyMsg);
        });

        var ui = {
            alertActive: false,
            alertQueue: [],
            alertButtons: {},
        };

        /**
         * Adds a message to the specified container using the specified template and saved properties.
         *
         * @param element container
         * @param element template
         * @param object saveObj
         */
        ui.addMsg = function addMsg(container, template, saveObj) {
            var content = template.content;
            content.querySelector('div').id = 'm' + uniqueMessageID;
            content.querySelector('.m').value = saveObj.message || '';

            if (template.id != 'aTemplate') {
                var numInputs = content.querySelectorAll('input[type="number"]');
                numInputs[0].value = saveObj.joins_low || 0;
                numInputs[1].value = saveObj.joins_high || 9999;
                if (template.id == 'tTemplate') {
                    content.querySelector('.t').value = saveObj.trigger || '';
                }
            }
            container.appendChild(document.importNode(content, true));

            //Groups done after appending or it doesn't work.
            if (template.id != 'aTemplate') {
                var selects = document.querySelectorAll('#m' + uniqueMessageID + ' > select');

                selects[0].value = saveObj.group || 'All';

                selects[1].value = saveObj.not_group || 'Nobody';
            }

            document.querySelector('#m' + uniqueMessageID + ' > a')
                .addEventListener('click', function(e) {
                    ui.alert('Really delete this message?', [
                        {text: 'Yes', style: 'success', action: function() {
                            this.remove();
                            hook.check('ui.messageDeleted');
                        }, thisArg: e.target.parentElement},
                        {text: 'Cancel'}
                    ]);
                }, false);

            uniqueMessageID++;
            hook.check('ui.messageAdded');
        };

        /**
        * Function used to require action from the user.
        *
        * @param string text the text to display in the alert
        * @param Array buttons an array of buttons to add to the alert.
        *        Format: [{text: 'Test', style:'success', action: function(){}, thisArg: window, dismiss: false}]
        *        Note: text is the only required paramater. If no button array is specified
        *        then a single OK button will be shown.
        *         Provided styles: success, danger, warning, info
        *        Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
        * @return void
        */
        ui.alert = function(text, buttons = [{text: 'OK'}]) {
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
                ui.alertQueue.push({text, buttons});
                return;
            }
            ui.alertActive = true;

            buttons.forEach(function(button, i) {
                button.dismiss = (button.dismiss === false) ? false : true; //Require that dismiss be set to false, otherwise true
                ui.alertButtons['button_' + i] = {action: button.action, thisArg: button.thisArg, dismiss: button.dismiss};
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
        ui.notify = function(text, displayTime = 2) {
            var el = document.createElement('div');
            el.classList.add('notification');
            el.classList.add('visible');
            el.textContent = text;
            document.body.appendChild(el);

            el.addEventListener('click', function() {
                this.remove();
            });
            setTimeout(function() {
                this.classList.remove('visible');
            }.bind(el), displayTime * 1000);
            setTimeout(function() {
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
        ui.buttonHandler = function(event) {
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
        ui.checkAlertQueue = function() {
            if (ui.alertQueue.length) {
                let alert = ui.alertQueue.shift();
                ui.alert(alert.text, alert.buttons);
            }
        };

        /**
         * Internal method used to change the page displayed to the user.
         *
         * @param EventArgs event
         * @return void
         */
        ui.globalTabChange = function(event) {
            if(event.target.getAttribute('g-tab-name') !== null) {
                //Content
                Array.from(document.querySelectorAll('div.visible:not(#header)'))
                    .forEach((el) => el.classList.remove('visible')); //We can't just remove the first due to browser lag
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
        ui.toggleMenu = function() {
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
        ui.addTab = function addTab(tabText, tabId, tabGroup = '#mainNavContents') {
            if (tabGroup != '#mainNavContents') {
                tabGroup = `#${tabGroup}_tabs`;
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
            let tab = document.querySelector('[g-tab-name="' + tabId + '"]');
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

        ui.addMessageToConsole = function addMessageToConsole(msg, name='', nameClass = '') {
            var msgEl = document.createElement('li');
            if (nameClass) {
                msgEl.setAttribute('class', nameClass);
            }

            var nameEl = document.createElement('span');
            nameEl.textContent = name;

            var contentEl = document.createElement('span');
            if (name) {
                contentEl.textContent = `: ${msg}`;
            } else {
                contentEl.textContent = msg;
            }
            msgEl.appendChild(nameEl);
            msgEl.appendChild(contentEl);

            var chat = document.querySelector('#mb_console ul');
            chat.appendChild(msgEl);

            hook.check('ui.addmessagetopage');
        };

        //rules format: array of objects
        // each object must have "selector"
        // each object can have "text" or "html" - any further attributes will be considered attributes.
        ui.buildContentFromTemplate = function(templateSelector, targetSelector, rules = []) {
            var content = document.querySelector(templateSelector).content;

            rules.forEach((rule) => {
                var el = content.querySelector(rule.selector);
                if (rule.text) {
                    el.textContent = rule.text;
                } else if (rule.html) {
                    el.innerHTML = rule.html;
                }

                Object.keys(rule)
                    .filter((key) => !['selector', 'text', 'html'].includes(key))
                    .forEach((key) => {
                        el.setAttribute(key, rule[key]);
                    });
            });

            document.querySelector(targetSelector).appendChild(document.importNode(content, true));
        };

        document.querySelector('#navOverlay').addEventListener('click', ui.toggleMenu);
        document.querySelector('#mainNav').addEventListener('click', ui.globalTabChange);

        return ui;
    };

    window.MessageBotUI = ui;
}());
