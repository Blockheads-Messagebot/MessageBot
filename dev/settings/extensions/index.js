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

//Create the extension store page
bhfansapi.getStore().then(resp => {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(extension => {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [
            {selector: '.card-header-title', text: extension.title},
            {selector: '.content', html: extension.snippet},
            {
                selector: '.card-footer-item',
                text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install',
                'data-id': extension.id
            }
        ]);
    });
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
document.querySelector('#exts')
    .addEventListener('click', function extActions(e) {
        var el = e.target;
        var id = el.dataset.id;

        if (!id) {
            return;
        }

        if (el.textContent == 'Install') {
            MessageBotExtension.install(id);
        } else {
            MessageBotExtension.uninstall(id);
        }
    });


hook.on('extension.install', function(id) {
    // Show remove to let users remove extensions
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstall', function(id) {
    // Show removed for store install button
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});
