/*global L, MutationObserver, window*/
function oldbrowsers() {
    'use strict';

    /**
     * Display an error if MutationObserver is not supported.
     * @return {Void}
     */
    function testMutationObserver() {
        if (typeof MutationObserver !== 'function') {
            document.getElementsByTagName('body')[0].innerHTML = 'Your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">MutationObserver</a>. Please update your browser.';
        }
    }

    /**
     * Init checks for old browsers
     * @return {Void}
     */
    function init() {
        testMutationObserver();
    }

    return {
        init: init
    };
}

module.exports = oldbrowsers();
