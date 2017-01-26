const ui = require('ui');
const fs = require('fs');
const helpers = require('./helpers');

var el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css', 'utf8');
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    require('./trigger'),
    require('./announcements')
].forEach(({tab, save, addMessage, start}) => {
    tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [
            {text: 'Yes', style: 'danger', action: function() {
                var el = event.target;
                while ((el = el.parentElement) && !el.classList.contains('column'))
                    ;
                el.remove();
                save();
            }},
            {text: 'Cancel'}
        ]);
    });

    tab.addEventListener('change', save);

    tab.querySelector('.button.is-primary')
        .addEventListener('click', () => addMessage());

    // Don't start responding to chat for 10 seconds
    setTimeout(start, 10000);
});

[
    require('./join'),
    require('./leave'),
    require('./trigger')
].forEach(({tab}) => {
    tab.addEventListener('change', function(event) {
        var el = event.target;
        while ((el = el.parentElement) && !el.classList.contains('column'))
            ;

        helpers.showSummary(el);
    });
});
