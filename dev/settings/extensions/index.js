const bhfansapi = require('libraries/bhfansapi');
const ui = require('ui');
const hook = require('libraries/hook');
const MessageBotExtension = require('MessageBotExtension');
const fs = require('fs');

var tab = ui.addTab('Extensions', 'settings');
tab.innerHTML = '<style>' +
    fs.readFileSync(__dirname + '/style.css', 'utf8') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html', 'utf8');

/**
 * Internal function used to add a card for an extension.
 *
 * extension is expected to contain a title, snippet, and id
 */
function addExtensionCard(extension) {
    if (!tab.querySelector(`#mb_extensions [data-id="${extension.id}"]`)) {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [
            {selector: '.card-header-title', text: extension.title},
            {selector: '.content', html: extension.snippet},
            {
                selector: '.card-footer-item',
                text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install',
                'data-id': extension.id
            }
        ]);
    }
}

//Create the extension store page
bhfansapi.getStore().then(resp => {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(addExtensionCard);
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
tab.querySelector('#exts')
    .addEventListener('click', function extActions(e) {
        var el = e.target;
        var id = el.dataset.id;

        if (!id) {
            return;
        }

        if (el.textContent == 'Install') {
            el.classList.add('is-loading');
            MessageBotExtension.install(id);
        } else {
            MessageBotExtension.uninstall(id);
        }
    });

tab.querySelector('.button').addEventListener('click', function loadExtension() {
    ui.alert('Enter the ID or URL of an extension:<br><input class="input"/>',
        [
            {text: 'Load', style: 'is-success', action: function() {
                let extRef = document.querySelector('#alert input').value;
                if (extRef.length) {
                    if (extRef.startsWith('http')) {
                        let el = document.createElement('script');
                        el.src = extRef;
                        document.head.appendChild(el);
                    } else {
                        MessageBotExtension.install(extRef);
                    }
                }
            }},
            {text: 'Cancel'}
        ]);
});



hook.on('extension.install', function(id) {
    // Show remove to let users remove extensions
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Remove';
        button.classList.remove('is-loading');
    } else {
        bhfansapi.getExtensionInfo(id)
            .then(addExtensionCard);
    }
});

hook.on('extension.uninstall', function(id) {
    // Show removed for store install button
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Removed';
        button.classList.add('is-disabled');
        setTimeout(() => {
            button.textContent = 'Install';
            button.classList.remove('is-disabled');
        }, 3000);
    }
});
