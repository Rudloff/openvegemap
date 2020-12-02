
export default class oldbrowsers {
    /**
     * Display an error if MutationObserver is not supported.
     * @return {void}
     */
    static testMutationObserver() {
        if (typeof MutationObserver !== 'function') {
            document.getElementsByTagName('body')[0].innerHTML = 'Your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">MutationObserver</a>. Please update your browser.';
        }
    }

    /**
     * Init checks for old browsers
     * @return {void}
     */
    static init() {
        this.testMutationObserver();
    }
}
