/*jslint browser: true, node: true*/
/*global window*/

if (typeof window !== 'object') {
    throw 'OpenVegeMap must be used in a browser.';
}

var L = require('leaflet'),
    OH = require('opening_hours'),
    PostalAddress = require('i18n-postal-address'),
    extractDomain = require('extract-domain');

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
            return '<ons-list-item modifier="nodivider"><div class="left list-item__title">' + name + '</div> <div class="right list-item__subtitle">' + value.replace(/_/g, ' ') + '</div></ons-list-item>';
        }
        return '';
    }

    /**
     * Get a popup table row containing the phone number.
     * @return {string} tr element
     */
    function getPhoneRow() {
        var row = '';

        if (tags['contact:phone'] && !tags.phone) {
            tags.phone = tags['contact:phone'];
        }
        if (tags.phone) {
            row = getPropertyRow('Phone number', '<a href="tel:' + tags.phone + '">' + tags.phone.replace(/\s/g, '&nbsp;') + '</a>');
        }
        return row;
    }

    /**
     * Get a popup table row containing the website.
     * @return {string} tr element
     */
    function getWebsiteRow() {
        var row = '',
            url = L.DomUtil.create('a');

        if (tags['contact:website'] && !tags.website) {
            tags.website = tags['contact:website'];
        }
        if (tags.website) {
            url.href = tags.website;
            if (url.hostname === 'localhost') {
                tags.website = 'http://' + tags.website;
            }
            row = getPropertyRow('Website', '<a target="_blank" rel="noopener" href="' + tags.website + '">' + extractDomain(tags.website) + '</a>');
        }
        return row;
    }

    /**
     * Get a popup table row containing the address.
     * @return {string} tr element
     */
    function getAddressRow() {
        var street = '',
            address = new PostalAddress.default();

        if (tags['addr:housenumber']) {
            street += tags['addr:housenumber'] + ' ';
        }
        if (tags['addr:street']) {
            street += tags['addr:street'];
        }

        address.setAddress1(street);
        address.setCity(tags['addr:city']);
        address.setPostalCode(tags['addr:postcode']);
        address.setFormat({
            country: tags['addr:country'],
            type: 'business'
        });

        return getPropertyRow('Address', address.toString());
    }

    /**
     * Get table rows to display in a marker popup.
     * @return {string} Set of tr elements
     */
    function getPopupRows() {
        var rows = '';
        rows += getPropertyRow('Vegan', tags['diet:vegan']);
        rows += getPropertyRow('Vegetarian', tags['diet:vegetarian']);
        if (tags.cuisine) {
            rows += getPropertyRow('Cuisine', tags.cuisine.replace(/;/g, ', '));
        }
        rows += getPropertyRow('Take away', tags.takeaway);

        rows += getAddressRow();
        rows += getPhoneRow();
        rows += getWebsiteRow();

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
