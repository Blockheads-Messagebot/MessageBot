// Listeners for user actions within the bot

// -- No dependencies

// Auto scroll when new messages are added to the page, unless the owner is reading old chat.
(new MutationObserver(function showNewChat() {
    let container = document.querySelector('#mb_console ul');
    let lastLine = document.querySelector('#mb_console li:last-child');

    if (!container || !lastLine) {
        return;
    }

    if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
        lastLine.scrollIntoView(false);
    }
})).observe(document.querySelector('#mb_console chat'), {childList: true});


// Remove old chat to reduce memory usage
(new MutationObserver(function removeOldChat() {
    var chat = document.querySelector('#mb_console ul');

    while (chat.children.length > 500) {
        chat.children[0].remove();
    }
})).observe(document.querySelector('#mb_console chat'), {childList: true});


// Change fullscreen tabs
document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
     var tabName = event.target.dataset.tabName;
    if(!tabName) {
        return;
    }

    //Content
    //We can't just remove the first due to browser lag
    Array.from(document.querySelectorAll('#container > .visible'))
        .forEach(el => el.classList.remove('visible'));
    document.querySelector(`#container > [data-tab-name=${tabName}]`).classList.add('visible');

    //Tabs
    Array.from(document.querySelector('#leftNav .selected'))
        .forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
});


// -- Depends on UI

var ui = require('./exports');


// Hide the menu when clicking the overlay
document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);
