/*jslint browser: true*/
/*global L, MutationObserver*/
var oldbrowser = (function () {
    'use strict';

    function testMutationObserver() {
        if (typeof MutationObserver !== 'function') {
            document.getElementsByTagName('body')[0].innerHTML = 'Your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">MutationObserver</a>. Please update your browser.';
        }
    }

    function init() {
        testMutationObserver();
    }

    return {
        init: init
    };
}());

if (typeof L === 'object') {
    L.DomEvent.on(window, 'load', oldbrowser.init);
} else {
    throw 'Leaflet is not loaded';
}
