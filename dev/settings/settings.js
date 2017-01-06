var ui = require('app/ui');
var MessageBotExtension = require('../../MessageBotExtension');


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
