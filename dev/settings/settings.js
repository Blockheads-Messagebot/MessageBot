var ui = require('app/ui');
var MessageBotExtension = require('../../MessageBotExtension');

document.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
    ui.alert('Enter the backup code:<textarea style="width:calc(100% - 7px);height:160px;"></textarea>',
                [
                    { text: 'Load & refresh page', style: 'success', action: function() {
                        var code = document.querySelector('#alert textarea').value;
                        try {
                            code = JSON.parse(code);
                            if (code === null) {
                                throw new Error('Invalid backup');
                            }
                        } catch (e) {
                            ui.notify('Invalid backup code. No action taken.');
                            return;
                        }

                        localStorage.clear();

                        Object.keys(code).forEach((key) => {
                            localStorage.setItem(key, code[key]);
                        });

                        location.reload();
                    } },
                    { text: 'Cancel' }
                ]);
});

document.querySelector('#mb_load_man').addEventListener('click', function loadExtension() {
    ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>',
                [
                    {text: 'Add', style: 'success', action: function() {
                        let extRef = document.querySelector('#alert input').value;
                        if (extRef.length) {
                            if (extRef.startsWith('http')) {
                                let el = document.createElement('script');
                                el.src = extRef;
                                document.head.appendChild(el);
                            } else {
                                MessageBotExtension.install(extRef);
                            }
                        }
                    }},
                    {text: 'Cancel'}
                ]);
});

document.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
    var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
    ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
});
