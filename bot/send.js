var api = require('../libs/blockheads');

function send(message) {
    chatBuffer.push(message);
}

//Helps avoid messages that are tacked onto the end of other messages.
var chatBuffer = [];
function checkBuffer() {
    if (chatBuffer.length) {
        api.send(chatBuffer.shift())
            .then(() => {
                setTimeout(checkBuffer, 1000);
            }, () => {
                setTimeout(checkBuffer, 10000);
            });
    } else {
        setTimeout(checkBuffer, 500);
    }
}
checkBuffer();

module.exports = send;
