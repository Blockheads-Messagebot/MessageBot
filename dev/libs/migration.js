(function(storage) {
    function update(keys, operator) {
        Object.keys(storage).forEach(item => {
            for (let key of keys) {
                if (item.startsWith(key)) {
                    storage.setItem(item, operator(storage.getItem(item)));
                    break;
                }
            }
        });
    }

    if (!storage.length) {
        return; //New install, nothing to migrate.
    }

    //jshint -W086
    //No break statements as we want to execute all updates after matched version.
    switch (storage.getItem('mb_version')) {
        case '5.2.0':
        case '5.2.1':
            //With 6.0, newlines are directly supported in messages by the bot.
            update(['announcementArr', 'joinArr', 'leaveArr', 'triggerArr'], function(raw) {
                try {
                    var parsed = JSON.parse(raw);
                    parsed.forEach(msg => {
                        if (msg.message) {
                            msg.message = msg.message.replace(/\\n/g, '\n');
                        }
                    });
                    return JSON.stringify(parsed);
                } catch(e) {
                    return raw;
                }
            });
    }
    //jshint +W086
}(localStorage));
