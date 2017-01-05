const ui = require('app/ui');
const storage = require('app/libraries/storage');
const api = require('app/libraries/blockheads');
const preferences = require('app/preferences');

var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = '<style>' +
    INCLUDE_FILE('/dev/messages/announcements/style.css') +
    '</style>' +
    INCLUDE_FILE('/dev/messages/announcements/tab.html');


function addMessage(text = '') {
    ui.buildContentFromTemplate('#aTemplate', '#aMsgs', [
        {selector: '.m', text: text}
    ]);
}


// Adding messages
tab.querySelector('.top-right-button').addEventListener('click', function() {
    addMessage();
});


// Saving on change
tab.addEventListener('change', function() {
    announcements = Array.from(tab.querySelectorAll('.m'))
        .map(el => {
            return {message: el.value};
        });

    storage.set('announcementArr', announcements);
});


// Announcements collection
var announcements = storage.getObject('announcementArr', []);

// Show saved announcements
announcements
    .map(ann => ann.message)
    .forEach(addMessage);


// Sends announcements after the specified delay.
(function announcementCheck(i) {
    i = (i >= announcements.length) ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        api.send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
})(0);
