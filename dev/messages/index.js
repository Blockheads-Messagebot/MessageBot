const ui = require('app/ui');

var el = document.createElement('style');
el.innerHTML = INCLUDE_FILE('/dev/messages/style.css');
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    // require('./trigger'),
    require('./announcements')
].forEach(type => {
    type.tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [
            {text: 'Yes', style: 'danger', action: function() {
                event.target.parentNode.remove();
                type.save();
            }},
            {text: 'Cancel'}
        ]);
    });

    type.tab.addEventListener('change', type.save);

    type.tab.querySelector('.top-right-button')
        .addEventListener('click', () => type.addMessage());
});
