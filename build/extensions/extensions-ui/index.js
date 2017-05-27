"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
var fs = require("fs");
bot_1.MessageBot.registerExtension('extensions-ui', function (ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI extension has been loaded.');
    }
    var style = document.createElement('style');
    style.textContent = require('./style.scss').css;
    document.head.appendChild(style);
    // Preformatted, user/id
    var extensions = ex.world.storage.getObject('extensions', [], false);
    function loadExtension(id) {
        var el = document.createElement('script');
        el.src = "http://blockheadsfans.com/messagebot/api/extension/" + id + "/source";
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    }
    extensions.forEach(loadExtension);
    var ui = ex.bot.getExports('ui');
    var tab = ui.addTab('Extensions');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');
    var template = tab.querySelector('template');
    var root = tab.querySelector('.columns');
    function buildCard(extension) {
        var id = (extension.user + "/" + extension.id).toLocaleLowerCase();
        var installed = extensions.includes(id);
        ui.buildTemplate(template, root, [
            { selector: '.card', 'data-id': id },
            { selector: '.card-header-title', text: extension.name },
            { selector: '.card-header-icon', text: extension.user, 'href': 'https://github.com/' + extension.user },
            { selector: '.content', html: extension.description },
            { selector: '.card-footer-item', text: installed ? 'Remove' : 'Install' },
        ]);
    }
    // Adding / removing extensions
    tab.addEventListener('click', function (event) {
        var target = event.target;
        if (target.tagName != 'A')
            return;
        var cardEl = target;
        while (!cardEl.classList.contains('card')) {
            cardEl = cardEl.parentElement;
        }
        var id = cardEl.dataset['id'];
        if (target.textContent == 'Install' && !extensions.includes(id)) {
            extensions.push(id);
            ex.world.storage.set('extensions', extensions, false);
            loadExtension(id);
            target.textContent = 'Loading...';
            setTimeout(function () { return target.textContent = 'Remove'; }, 2000);
        }
        else if (target.textContent == 'Remove' && extensions.includes(id)) {
            extensions.splice(extensions.indexOf(id), 1);
            ex.world.storage.set('extensions', extensions, false);
            bot_1.MessageBot.deregisterExtension(id);
        }
    });
    // Loading by ID / URL
    tab.querySelector('.button').addEventListener('click', function () {
        var result = prompt('Enter the ID / URL of an extension to load');
        if (!result)
            return;
        result = result.toLocaleLowerCase();
        if (/[\w\-]{3,}\/[\w\-]{3,}/.test(result) && !extensions.includes(result)) {
            // Load by ID, autoload in future.
            extensions.push(result);
            ex.world.storage.set('extensions', extensions, false);
            loadExtension(result);
            // Add to the page
            var card = tab.querySelector(".card[data-id=\"" + result + "\"]");
            if (card) {
                // Already on the page, loaded a known extension by ID
                var link_1 = card.querySelector('.card-footer-item');
                link_1.textContent = 'Loading...';
                setTimeout(function () { return link_1.textContent = 'Remove'; }, 2000);
                return;
            }
            // Not on the page, ask BHFans for info
            ex.ajax.getJSON("http://blockheadsfans.com/messagebot/api/extension/" + result)
                .then(function (response) {
                if (response.status == 'ok') {
                    buildCard(response);
                }
            });
        }
        else {
            // Load by URL, don't autoload in future, don't add to the page.
            var el = document.createElement('script');
            el.src = result;
            document.head.appendChild(el);
        }
    });
    // Build the extension page
    ex.ajax.getJSON('http://blockheadsfans.com/messagebot/api/extensions')
        .then(function (response) {
        if (response.status != 'ok') {
            ui.notify('Unable to fetch extensions.');
            return;
        }
        var exs = response.extensions;
        exs.forEach(buildCard);
        var unlisted = extensions
            .filter(function (id) { return exs
            .every(function (ex) { return id != (ex.user + "/" + ex.id).toLocaleLowerCase(); }); });
        // If the extension does not exist, a generic description will be returned
        unlisted.forEach(function (id) {
            ex.ajax.getJSON("http://blockheadsfans.com/messagebot/api/extension/" + id)
                .then(function (response) {
                if (response.status == 'ok') {
                    buildCard(response);
                }
            });
        });
    });
    ex.uninstall = function () {
        ui.removeTab(tab);
        style.remove();
    };
});
