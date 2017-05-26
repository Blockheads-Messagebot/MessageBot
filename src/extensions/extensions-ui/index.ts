import { MessageBot } from '../../bot';
import { UIExtensionExports } from '../ui';

import * as fs from 'fs';

interface ExtensionInfo {
    id: string;
    user: string;
    public: '1' | '0';
    name: string;
    description: string;
    last_modified: string;
}

MessageBot.registerExtension('extensions-ui', function(ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI extension has been loaded.');
    }

    // Preformatted, user/id
    let extensions = ex.world.storage.getObject('extensions', [] as string[], false);

    function loadExtension(id: string) {
        let el = document.createElement('script');
        el.src = `http://blockheadsfans.com/messagebot/api/extension/${id}/source`;
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    }

    extensions.forEach(loadExtension);

    let ui = ex.bot.getExports('ui') as UIExtensionExports;

    let tab = ui.addTab('Extensions');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');

    let template = tab.querySelector('template') as HTMLTemplateElement;
    let root = tab.querySelector('.columns') as HTMLDivElement;

    function buildCard(extension: ExtensionInfo) {
        let id = `${extension.user}/${extension.id}`.toLocaleLowerCase();
        let installed = extensions.includes(id);

        ui.buildTemplate(template, root, [
            { selector: '.card', 'data-id': id },
            { selector: '.card-header-title', text: extension.name },
            { selector: '.card-header-icon', text: extension.user, 'href': 'https://github.com/' + extension.user },
            { selector: '.content', html: extension.description },
            { selector: '.card-footer-item', text: installed ? 'Remove' : 'Install' },
        ]);
    }

    // Adding / removing extensions
    tab.addEventListener('click', event => {
        let target = event.target as HTMLAnchorElement;
        if (target.tagName != 'A') return;

        let cardEl = target as HTMLElement;
        while (!cardEl.classList.contains('card')) {
            cardEl = cardEl.parentElement as HTMLElement;
        }
        let id = cardEl.dataset['id'] as string;

        if (target.textContent == 'Install' && !extensions.includes(id)) {
            extensions.push(id);
            ex.world.storage.set('extensions', extensions, false);
            loadExtension(id);

            target.textContent = 'Loading...';
            setTimeout(() => target.textContent = 'Remove', 2000);
        } else if (target.textContent == 'Remove' && extensions.includes(id)) {
            extensions.splice(extensions.indexOf(id), 1);
            ex.world.storage.set('extensions', extensions, false);
            MessageBot.deregisterExtension(id);
        }
    });

    // Loading by ID / URL
    (tab.querySelector('.button') as HTMLElement).addEventListener('click', () => {
        let result = prompt('Enter the ID / URL of an extension to load');
        if (!result) return;
        result = result.toLocaleLowerCase();

        if (/[\w\-]{3,}\/[\w\-]{3,}/.test(result) && !extensions.includes(result)) {
            // Load by ID, autoload in future.
            extensions.push(result);
            ex.world.storage.set('extensions', extensions, false);
            loadExtension(result);

            // Add to the page
            let card = tab.querySelector(`.card[data-id="${result}"]`);
            if (card) {
                // Already on the page, loaded a known extension by ID
                let link = card.querySelector('.card-footer-item') as HTMLElement;
                link.textContent = 'Loading...';
                setTimeout(() => link.textContent = 'Remove', 2000);
                return;
            }

            // Not on the page, ask BHFans for info
            ex.ajax.getJSON(`http://blockheadsfans.com/messagebot/api/extension/${result}`)
                .then((response: { status: string } & ExtensionInfo) => {
                    if (response.status == 'ok') {
                        buildCard(response);
                    }
                });
        } else {
            // Load by URL, don't autoload in future, don't add to the page.
            let el = document.createElement('script');
            el.src = result;
            document.head.appendChild(el);
        }
    });

    // Build the extension page
    ex.ajax.getJSON('http://blockheadsfans.com/messagebot/api/extensions')
        .then((response: {status: string, extensions: ExtensionInfo[]}) => {
            if (response.status != 'ok') {
                ui.notify('Unable to fetch extensions.');
                return;
            }

            let exs = response.extensions;

            exs.forEach(buildCard);

            let unlisted = extensions
                .filter(id => exs
                    .every(ex => id != `${ex.user}/${ex.id}`.toLocaleLowerCase()));

            // If the extension does not exist, a generic description will be returned
            unlisted.forEach(id => {
                ex.ajax.getJSON(`http://blockheadsfans.com/messagebot/api/extension/${id}`)
                    .then((response: {status: string} & ExtensionInfo) => {
                        if (response.status == 'ok') {
                            buildCard(response);
                        }
                    });
            });
        });
});
