import { MessageBot, MessageBotExtension } from '../../bot';
import { UIExtensionExports } from '../ui';

import { JoinMessageConfig, LeaveMessageConfig, TriggerMessageConfig, AnnouncementMessageConfig } from '../messages';

import * as fs from 'fs';

MessageBot.registerExtension('messages-ui', function(ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI has been loaded.');
    }

    let ui = ex.bot.getExports('ui') as UIExtensionExports;

    ui.addTabGroup('Messages', 'messages');

    let tabs = [
        new JoinTab(ex, ui),
        new LeaveTab(ex, ui),
        new TriggerTab(ex, ui),
        new AnnouncementTab(ex, ui),
    ];

    ex.uninstall = function() {
        tabs.forEach(tab => tab.remove());
    };
});

abstract class MessagesTab<T> {
    protected tab: HTMLDivElement;
    protected ui: UIExtensionExports;
    protected ex: MessageBotExtension;

    protected root: HTMLDivElement;
    protected template: HTMLTemplateElement;

    abstract getStorageID(): string;
    abstract addMessage(message?: Partial<T>): void;
    abstract insertHTML(): void;

    constructor({name, ui, ex}: {name: string, ui: UIExtensionExports, ex: MessageBotExtension}) {
        this.ui = ui;
        this.ex = ex;
        this.tab = ui.addTab(name, 'messages');

        this.insertHTML();
        this.template = this.tab.querySelector('template') as HTMLTemplateElement;
        this.root = this.tab.querySelector('.messages-container') as HTMLDivElement;

        // Auto save messages
        this.tab.addEventListener('input', () => this.save());
        // Create a new message
        let button = this.tab.querySelector('.button.is-primary') as HTMLElement;
        button.addEventListener('click', () => {
            this.addMessage();
        });
        // Deleting messages
        this.tab.addEventListener('click', event => {
            let target = event.target as HTMLElement;
            if (target.tagName == 'A' && target.textContent == 'Delete') {
                event.preventDefault();

                ui.alert(
                    'Really delete this message?',
                    [{text: 'Delete', style: 'is-danger'}, {text: 'Cancel'}],
                    result => {
                        if (result != 'Delete') return;

                        let parent = target;
                        while(!parent.classList.contains('column')) {
                            parent = parent.parentElement as HTMLElement;
                        }
                        parent.remove();
                        this.save();
                    }
                );
            }
        });

        this.ex.world.storage.getObject(this.getStorageID(), [] as T[]).forEach(message => {
            this.addMessage(message);
        });
    }

    remove() {
        this.ui.removeTab(this.tab);
    }

    save() {
        this.ex.world.storage.set(this.getStorageID(), this.getMessages());
    }

    getMessages(): {[key: string]: string | number}[] {
        let messages: {[key: string]: string | number}[] = [];

        Array.from(this.root.children).forEach(element => {
            let data: { [key: string]: string | number } = {};

            Array.from(element.querySelectorAll('[data-target]')).forEach((input: HTMLElement) => {
                let name = input.dataset['target'];
                if (!name) return;

                switch(input.getAttribute('type')) {
                    case 'number':
                        data[name] = +(input as HTMLInputElement).value;
                        break;
                    default:
                        data[name] = (input as HTMLInputElement).value;
                }
            });

            messages.push(data);
        });

        return messages;
    }
}

class JoinTab extends MessagesTab<JoinMessageConfig> {
    constructor(ex: MessageBotExtension, ui: UIExtensionExports) {
        super({name: 'Join', ui, ex});
    }

    insertHTML() {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/join.html', 'utf8');
    }

    getStorageID() {
        return 'joinArr';
    }

    addMessage(msg: Partial<JoinMessageConfig> = {}) {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' },
        ]);
    }
}

class LeaveTab extends MessagesTab<LeaveMessageConfig> {
    constructor(ex: MessageBotExtension, ui: UIExtensionExports) {
        super({name: 'Leave', ui, ex});
    }

    insertHTML() {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/leave.html', 'utf8');
    }

    getStorageID() {
        return 'leaveArr';
    }

    addMessage(msg: Partial<LeaveMessageConfig> = {}) {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ]);
    }
}

class TriggerTab extends MessagesTab<TriggerMessageConfig> {
    constructor(ex: MessageBotExtension, ui: UIExtensionExports) {
        super({name: 'Trigger', ui, ex});
    }

    insertHTML() {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/trigger.html', 'utf8');
    }

    getStorageID() {
        return 'triggerArr';
    }

    addMessage(msg: Partial<TriggerMessageConfig> = {}) {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
            { selector: '[data-target=trigger]', value: msg.trigger || ''},
            { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
            { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
            { selector: '[data-target=group]', value: msg.group || 'all' },
            { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
        ]);
    }
}

class AnnouncementTab extends MessagesTab<AnnouncementMessageConfig> {
    constructor(ex: MessageBotExtension, ui: UIExtensionExports) {
        super({name: 'Announcements', ui, ex});
    }

    insertHTML() {
        this.tab.innerHTML = fs.readFileSync(__dirname + '/announcements.html', 'utf8');
    }

    getStorageID() {
        return 'announcementArr';
    }

    addMessage(msg: Partial<TriggerMessageConfig> = {}) {
        this.ui.buildTemplate(this.template, this.root, [
            { selector: '[data-target=message]', text: msg.message || '' },
        ]);
    }
}
