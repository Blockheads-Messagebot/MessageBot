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
 * Builds a template into a new node using the provided rules.
 *
 * @hidden
 * @param template the template to clone.
 * @param target the parent node to append the cloned template to.
 * @param rules the rules to apply to the cloned template before appending it to the target.
 */
export declare function buildTemplate(template: string | HTMLTemplateElement, target: string | HTMLElement, rules?: TemplateRule[]): void;
