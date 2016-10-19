(function() {
    var create = function(hook, bhfansapi) { //jshint ignore:line
        var uniqueMessageID = 0;

        document.head.innerHTML = '{{inject ../dist/tmphead.html}}';
        document.head.innerHTML += '<style>{{inject ../dist/tmpbot.css}}<style>';
        document.body.innerHTML = '{{inject ../dist/tmpbody.html}}';

        var mainToggle = document.querySelector('#leftNav input');

        function listenerHook(selector, type, hookname) {
            document.querySelector(selector)
                .addEventListener(type, () => hook.check(`ui.${hookname}`));
        }

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

        //Install / uninstall extensions
        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            if (e.target.tagName != 'BUTTON') {
                return;
            }
            var button = e.target;
            var extId = button.parentElement.dataset.id;

            if (button.textContent == 'Install') {
                bhfansapi.startExtension(extId);
            } else {
                bhfansapi.removeExtension(extId);
            }
        });

        //Change screen tabs
        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            if(!tabName) {
                return;
            }

            //Content
            //We can't just remove the first due to browser lag
            Array.from(document.querySelectorAll('#container > .visible'))
                .forEach((el) => el.classList.remove('visible'));
            document.querySelector(`#container > [data-tab-name=${tabName}]`).classList.add('visible');

            //Tabs
            document.querySelector('#leftNav .selected').classList.remove('selected');
            event.target.classList.add('selected');
        });

        //Details polyfill, older firefox, IE
        if (!('open' in document.createElement('details'))) {
            let style = document.createElement('style');
            style.textContent += 'details:not([open]) > :not(summary) { display: none !important; }' +
                'details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; }' +
                'details[open] > summary:before { transform: rotate(90deg); }';
            document.head.appendChild(style);

            window.addEventListener('click', function(event) {
                if (event.target.tagName == 'SUMMARY') {
                    var details = event.target.parentNode;

                    if (!details) {
                        return;
                    }

                    if (details.getAttribute('open')) {
                        details.open = false;
                        details.removeAttribute('open');
                    } else {
                        details.open = true;
                        details.setAttribute('open', 'open');
                    }
                }
            });
        }

        //Create the store page
        bhfansapi.getStore().then(resp => {
            if (resp.status != 'ok') {
                document.getElementById('exts').innerHTML += resp.message;
                throw new Error(resp.message);
            }
            resp.extensions.forEach(extension => {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [
                    {selector: 'h4', text: extension.title},
                    {selector: 'span', html: extension.snippet},
                    {selector: '.ext', 'data-id': extension.id},
                    {selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install'}
                ]);
            });
        }).catch(bhfansapi.reportError);

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

        var ui = {};

        /**
         * Adds a message to the specified container using the specified template and saved properties.
         * It is not encouraged for extension developers to call this function.
         *
         * @param element container
         * @param element template
         * @param object saveObj
         */
        ui.addMsg = function addMsg(container, template, saveObj) {
            var content = template.content;
            content.querySelector('div').id = 'm' + uniqueMessageID;
            content.querySelector('.m').textContent = saveObj.message || '';

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


        var alert = {
            active: false,
            queue: [],
            buttons: {},
        };

        function buttonHandler(event) {
            var button = alert.buttons[event.target.id] || {};
            button.thisArg = button.thisArg || undefined;
            button.dismiss = typeof button.dismiss == 'boolean' ? button.dismiss : true;
            if (typeof button.action == 'function') {
                button.action.call(button.thisArg);
            }

            //Require that there be an action asociated with no-dismiss buttons.
            if (button.dismiss || typeof button.action != 'function') {
                document.querySelector('#alert').classList.remove('visible');
                document.querySelector('#alert ~ .overlay').classList.remove('visible');
                document.querySelector('#alert .buttons').innerHTML = '';
                alert.buttons = {};
                alert.active = false;

                // Are more alerts waiting to be shown?
                if (alert.queue.length) {
                    let alert = alert.queue.shift();
                    ui.alert(alert.text, alert.buttons);
                }
            }
        }

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
            function buildButton(button) {
                var el = document.createElement('span');
                el.innerHTML = button.text;
                if (button.style) {
                    el.classList.add(button.style);
                }
                el.id = button.id;
                el.addEventListener('click', buttonHandler);
                document.querySelector('#alert .buttons').appendChild(el);
            }

            if (alert.active) {
                alert.queue.push({text, buttons});
                return;
            }
            alert.active = true;

            buttons.forEach(function(button, i) {
                button.dismiss = (button.dismiss === false) ? false : true; //Require that dismiss be set to false, otherwise true
                alert.buttons['button_' + i] = {action: button.action, thisArg: button.thisArg, dismiss: button.dismiss};
                button.id = 'button_' + i;
                buildButton(button);
            });
            document.querySelector('#alertContent').innerHTML = text;

            document.querySelector('#alert ~ .overlay').classList.add('visible');
            document.querySelector('#alert').classList.add('visible');
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
         * @param string groupName Optional. If provided, the name of the group of tabs to add this tab to.
         * @return div - The div to place tab content in
         */
        ui.addTab = (function () {
            var tabNameUID = 0;

            return function addTab(tabText, groupName = 'main') {
                var tabName = 'botTab_' + tabNameUID++;

                var tab = document.createElement('span');
                tab.textContent = tabText;
                tab.classList.add('tab');
                tab.dataset.tabName = tabName;

                var tabContent = document.createElement('div');
                tabContent.dataset.tabName = tabName;

                document.querySelector(`#leftNav [data-tab-group=${groupName}]`).appendChild(tab);
                document.querySelector('#container').appendChild(tabContent);

                return tabContent;
            };
        }());

        /**
         * Removes a global tab by it's id.
         *
         * @param div tabContent The div returned by the addTab function.
         */
        ui.removeTab = function removeTab(tabContent) {
            document.querySelector(`#leftNav [data-tab-name=${tabContent.dataset.tabName}]`).remove();
            tabContent.remove();
        };

        /**
         * Creates a tab group in which tabs can be placed.
         *
         * @param string text - The text the user will see
         * @param string groupName - The name of the group which can be used to add tabs within the group.
         * @return void
         */
        ui.addTabGroup = function addTabGroup(text, groupName) {
            var details = document.createElement('details');
            details.dataset.tabGroup = groupName;

            var summary = document.createElement('summary');
            summary.textContent = text;
            details.appendChild(summary);

            document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
        };

        /**
         * Removes a tab group and all tabs contained within the specified group.
         *
         * @param string groupName the name of the group that was used in ui.addTabGroup.
         */
        ui.removeTabGroup = function removeTabGroup(groupName) {
            var group = document.querySelector(`#leftNav [data-tab-group="${groupName}"]`);
            var items = Array.from(group.querySelectorAll('span'));

            items.forEach(item => {
                //Tab content
                document.querySelector(`#container [data-tab-name="${item.dataset.tabName}"]`).remove();
            });

            group.remove();
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

        // rules format: array of objects
        // each object must have "selector"
        // each object can have "text" or "html" - any further keys will set as attributes.
        ui.buildContentFromTemplate = function(templateSelector, targetSelector, rules = []) {
            var template = document.querySelector(templateSelector);
            //Fix IE
            if (!('content' in template)) {
                let content = template.childNodes;
                let fragment = document.createDocumentFragment();

                for (let j = 0; j < content.length; j++) {
                    fragment.appendChild(content[j]);
                }

                template.content = fragment;
            }

            var content = template.content;

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

        document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);

        return ui;
    };

    window.MessageBotUI = create;
}());
