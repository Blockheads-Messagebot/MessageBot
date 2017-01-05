var bhfansapi = require('app/libraries/bhfansapi');
var ui = require('app/ui');
var hook = require('../../libs/hook');
var MessageBotExtension = require('../../MessageBotExtension');

//Create the extension store page
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

// Install / uninstall extensions
function extActions(tagName, e) {
    if (e.target.tagName != tagName) {
        return;
    }
    var el = e.target;
    var id = el.parentElement.dataset.id;

    if (el.textContent == 'Install') {
        MessageBotExtension.install(id);
    } else {
        MessageBotExtension.uninstall(id);
    }
}

document.querySelector('#exts')
    .addEventListener('click', extActions.bind(null, 'BUTTON'));

document.querySelector('#mb_ext_list')
    .addEventListener('click', extActions.bind(null, 'A'));


hook.on('extension.installed', function(id) {
    //List
    bhfansapi.getExtensionName(id).then(resp => {
        var container = document.querySelector('#mb_ext_list ul');
        if (resp.status != 'ok') {
            throw new Error(resp.message);
        }

        let li = document.createElement('li');
        let span = document.createElement('span');
        let a = document.createElement('a');

        span.textContent = `${resp.name} (${resp.id})`;
        a.textContent = 'Remove';
        li.dataset.id = resp.id;

        li.appendChild(span);
        li.appendChild(a);
        container.appendChild(li);
    }).catch(bhfansapi.reportError);

    //Store
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstalled', function(id) {
    //List
    var li = document.querySelector(`#mb_ext_list [data-id="${id}"]`);
    if (li) {
        li.remove();
    }

    //Store
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});
