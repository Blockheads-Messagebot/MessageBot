const ui = require('app/ui');
const prefs = require('app/settings');
const fs = require('fs');

var tab = ui.addTab('Settings');
tab.innerHTML = '<style>' +
    fs.readFileSync(__dirname + '/style.css') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html');

// Show prefs
Object.keys(prefs).forEach(key => {
    var el = tab.querySelector(`[data-key="${key}"]`);
    switch (typeof prefs[key]) {
        case 'boolean':
            el.checked = prefs[key];
            break;
        default:
            el.value = prefs[key];
    }
});


// Watch for changes
tab.addEventListener('change', function save() {
    var getValue = (key) => tab.querySelector(`[data-key="${key}"]`).value;
    var getInt = (key) => +getValue(key);
    var getChecked = (key) => tab.querySelector(`[data-key="${key}"]`).checked;

    Object.keys(prefs).forEach(key => {
        var func;

        switch(typeof prefs[key]) {
            case 'boolean':
                func = getChecked;
                break;
            case 'number':
                func = getInt;
                break;
            default:
                func = getValue;
        }

        prefs[key] = func(key);
    });
});


// Get backup
tab.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
    var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
    ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
});


// Load backup
tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
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
