/*jslint browser: true, node: true*/
/*global window*/

if (typeof window !== 'object') {
    throw 'OpenVegeMap must be used in a browser.';
}

var L = require('leaflet'),
    OH = require('opening_hours');

/**
 * Popup class constructor.
 * @param {Object} tags POI tags
 * @constructor
 * @returns {Object} Popup object
 */
function Popup(tags) {
    'use strict';

    /**
     * Generate an opening hours button to display in a marker popup.
     * @param  {string} value Value of the opening_hours tag
     * @return {string} ons-list-item element
     */
    function getOpeningHoursBtn(value) {
        var oh = new OH(value, null);
        return '<ons-list-item id="hoursBtn" data-dialog="hoursPopup" tappable modifier="chevron"><div class="left">Opening hours<br/>(' + oh.getStateString(new Date(), true) + ')</div></ons-list-item>';
    }

    /**
     * Generate a row to display in a marker popup.
     * @param  {string} name  Name of the property
     * @param  {string} value Value of the property
     * @return {string} ons-list-item element
     */
    function getPropertyRow(name, value) {
        if (value) {
            return '<ons-list-item modifier="nodivider"><div class="left">' + name + '</div> <div class="right">' + value.replace(/_/g, ' ') + '</div></ons-list-item>';
        }
        return '';
    }

    /**
     * Get table rows to display in a marker popup.
     * @return {string} Set of tr elements
     */
    function getPopupRows() {
        var rows = '',
            url = L.DomUtil.create('a');
        rows += getPropertyRow('Vegan', tags['diet:vegan']);
        rows += getPropertyRow('Vegetarian', tags['diet:vegetarian']);
        if (tags.cuisine) {
            rows += getPropertyRow('Cuisine', tags.cuisine.replace(/;/g, ', '));
        }
        rows += getPropertyRow('Take away', tags.takeaway);
        if (tags.phone) {
            rows += getPropertyRow('Phone number', '<a href="tel:' + tags.phone + '">' + tags.phone.replace(/\s/g, '&nbsp;') + '</a>');
        }
        if (tags.website) {
            url.href = tags.website;
            if (url.hostname === 'localhost') {
                tags.website = 'http://' + tags.website;
            }
            rows += getPropertyRow('Website', '<a target="_blank" href="' + tags.website + '">' + tags.website + '</a>');
        }
        if (tags.opening_hours) {
            rows += getOpeningHoursBtn(tags.opening_hours);
        }
        return rows;
    }

    return {
        getPopupRows: getPopupRows
    };
}

module.exports = Popup;
