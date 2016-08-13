/*global
    MessageBot
*/

let bot = MessageBot();
bot.start();

window.addEventListener('error', (err) => {
    //Wrap everything here in a try catch so that errors with our error reporting don't generate more errors to be reported... infinite loop.
    try {
        if (!bot.devMode) {
            if (err.message == 'Script error') {
                bot.ui.notify('Your bookmark is likely outdated, unable to report error.');
                return;
            }
            console.info('Reporting error:', err);
            bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
                {
                    world_name: bot.core.worldName,
                    world_id: window.worldId,
                    owner_name: bot.core.ownerName,
                    bot_version: bot.version,
                    error_text: err.message,
                    error_file: err.filename,
                    error_row: err.lineno,
                    error_column: err.colno,
                })
                .then((resp) => {
                    if (resp.status == 'ok') {
                        bot.ui.notify('Something went wrong, it has been reported.');
                    } else {
                        throw new Error(resp.message);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    bot.ui.notify(`Error reporting exception: ${err}`);
                });
        }
    } catch (e) {
        console.error(e);
    }
});
