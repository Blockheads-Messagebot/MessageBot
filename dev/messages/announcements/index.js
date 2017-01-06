const ui = require('app/ui');
const storage = require('app/libraries/storage');
const send = require('app/bot').send;
const preferences = require('app/settings');

var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = INCLUDE_FILE('/dev/messages/announcements/tab.html');

module.exports = {
    tab,
    save,
    addMessage,
};

function addMessage(text = '') {
    ui.buildContentFromTemplate('#aTemplate', '#aMsgs', [
        {selector: '.m', text: text}
    ]);
}

function save() {
    announcements = Array.from(tab.querySelectorAll('.m'))
        .map(el => {
            return {message: el.value};
        });

    storage.set('announcementArr', announcements);
}

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
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
})(0);
