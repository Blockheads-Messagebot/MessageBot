export function notify(text: string, displayTime: number = 2) {
    var el = document.createElement('div');
    el.classList.add('bot-notification', 'is-active');
    el.textContent = text;
    document.body.appendChild(el);
    var timeouts = [
        // Fade out after displayTime
        setTimeout(() => {
            el.classList.remove('is-active');
        }, displayTime * 1000),
        // Remove after fade out
        setTimeout(() => {
            el.remove();
        }, displayTime * 1000 + 2100)
    ];


    el.addEventListener('click', (event) => {
        timeouts.forEach(clearTimeout);
        (event.target as HTMLElement).remove();
    });
}

export {alert} from './alert';
