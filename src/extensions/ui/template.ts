/**
 * The format for rules passed to buildTemplate.
 */
export interface TemplateRule {
    /**
     * The CSS selector to be used to find elements to update.
     */
    selector: string;
    /**
     * Whether only the first, or all matching elements should be updated. Default: false
     */
    multiple?: boolean;
    /**
     * The text to set in the element.
     */
    text?: string;
    /**
     * If the text is not set, can be used to set the HTML of the element.
     */
    html?: string;
    /**
     * Any other attributes to be set on the element.
     */
    [key: string]: any;
}

/**
 * Updates an element according to the passed rule.
 *
 * @param el the element to update.
 * @param rule the rule to use to update the element.
 */
function updateElement(el: Element, rule: TemplateRule) {
    if (typeof rule.text == 'string') {
        el.textContent = rule.text;
    } else if (typeof rule.html == 'string') {
        el.innerHTML = rule.html;
    }

    let blacklist = ['selector', 'text', 'html', 'multiple'];

    if (el instanceof HTMLTextAreaElement && 'value' in rule) {
        blacklist.push('value');
        el.textContent = rule['value'];
    }

    Object.keys(rule)
        .filter(key => !blacklist.includes(key))
        .forEach(key => el.setAttribute(key, rule[key]));
}

/**
 * Finds elements to update using the passed rule.
 *
 * @param parent the parent to check for matching nodes.
 * @param rule the rule to use.
 */
function handleRule(parent: DocumentFragment, rule: TemplateRule) {
    if (rule.multiple) {
        Array.from(parent.querySelectorAll(rule.selector)).forEach(el => {
            updateElement(el, rule);
        });
    } else {
        let el = parent.querySelector(rule.selector);
        if (!el) {
            console.warn(`Unable to update ${rule.selector}.`, rule);
            return;
        }

        updateElement(el, rule);
    }
}

/**
 * Builds a template into a new node using the provided rules.
 *
 * @hidden
 * @param template the template to clone.
 * @param target the parent node to append the cloned template to.
 * @param rules the rules to apply to the cloned template before appending it to the target.
 */
export function buildTemplate(template: string | HTMLTemplateElement, target: string | HTMLElement, rules?: TemplateRule[]) {
    if (typeof template == 'string') {
        template = document.querySelector(template) as HTMLTemplateElement;
        if (!template) throw new Error("Template not found.");
    }
    if (typeof target == 'string') {
        target = document.querySelector(target) as HTMLElement;
        if (!target) throw new Error("Target not found.");
    }

    // Remove this cast when Typedoc updates to Typescript 2.3
    let parent = document.importNode(template.content, true) as DocumentFragment;

    if (Array.isArray(rules)) {
        for (let rule of rules) {
            handleRule(parent, rule);
        }
    }

    target.appendChild(parent);
}
