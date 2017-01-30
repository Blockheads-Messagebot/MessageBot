module.exports = {
    notify,
};

/**
 * Function used to send a non-critical alert to the user.
 * Should be used in place of ui.alert if possible as it is non-blocking.
 *
 * @example
 * //Shows a notfication for 2 seconds
 * ui.notify('Notification');
 * //Shows a notification for 5 seconds
 * ui.notify('Notification', 5);
 * @param {String} text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
 * @param {Number} displayTime the number of seconds to show the notification for.
 */
function notify(text, displayTime = 2) {
    var el = document.createElement('div');
    el.classList.add('bot-notification', 'is-active');
    el.textContent = text;
    document.body.appendChild(el);
    var timeouts = [
        // Fade out after displayTime
        setTimeout(function() {
            this.classList.remove('is-active');
        }.bind(el), displayTime * 1000),
        // Remove after fade out
        setTimeout(function() {
            this.remove();
        }.bind(el), displayTime * 1000 + 2100)
    ];


    el.addEventListener('click', function() {
        timeouts.forEach(clearTimeout);
        this.remove();
    });
}
