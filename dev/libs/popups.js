(function(ui, bhfansapi) {
    function onClick(selector, handler) {
        Array.from(document.querySelectorAll(selector))
            .forEach((el) => el.addEventListener('click', handler));
    }

    onClick('#mb_backup_load', function loadBackup() {
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

    onClick('#mb_load_man', function loadExtension() {
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
                                    bhfansapi.startExtension(extRef);
                                }
                            }
                        }},
                        {text: 'Cancel'}
                    ]);
    });

    onClick('#mb_backup_save', function showBackup() {
        var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
        ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
    });
}(window.botui, window.bhfansapi));
