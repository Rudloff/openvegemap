import L from 'leaflet';
import PostalAddress from 'i18n-postal-address';
import extractDomain from 'extract-domain';
import {SimpleOpeningHours} from 'simple-opening-hours';

export default class Popup {

    /**
     * Popup class constructor.
     * @param {Object} tags POI tags
     * @param {string} tags.craft
     * @param {string} tags.amenity
     * @param {string} tags.shop
     * @param {string} tags.cuisine
     * @param {string} tags.takeaway
     * @param {string} tags.toilets
     * @param {string} tags.changing_table
     * @param {string} tags.description
     * @param {string} tags.opening_hours
     * @param {string} tags.phone
     * @param {string} tags.website
     * @returns {void} Popup object
     */
    constructor(tags) {
        this.tags = tags;
    }

    /**
     * Generate an opening hours button to display in a marker popup.
     * @return {string} ons-list-item element
     */
    getOpeningHoursBtn() {
        if (this.tags.opening_hours) {
            try {
                const opening = new SimpleOpeningHours(this.tags.opening_hours);

                let state;
                if (opening.isOpenNow()) {
                    state = 'Open';
                } else {
                    state = 'Closed';
                }

                return '<ons-list-item id="hoursBtn" data-dialog="hoursPopup" tappable modifier="chevron nodivider"><div class="left">Opening hours<br/>(' + state + ')</div></ons-list-item>';
            } catch (error) {
                console.error(
                    'Malformed opening hours data: ' + error
                );
            }
        }

        return '';
    }

    /**
     * Get a popup row containing the description.
     * @return {string} ons-list-item element
     */
    getDescriptionBtn() {
        if (this.tags.description) {
            return '<ons-list-item expandable modifier="nodivider">Description<div class="expandable-content"><small>' + this.tags.description + '</small></div></ons-list-item>';
        }

        return '';
    }

    /**
     * Generate a row to display in a marker popup.
     * @param  {string} name  Name of the property
     * @param  {string} value Value of the property
     * @param  {string} key Key as used for title of OSM Wiki.
     * @return {string} ons-list-item element
     */
    getPropertyRow(name, value, key) {
        var html = '';
        if (value) {
            html += '<ons-list-item modifier="nodivider"><div class="left list-item__title">';
            if (key) {
                html += '<a target="_blank" href="https://wiki.openstreetmap.org/wiki/Key%3A' + key + '">' + name + '</a>';
            } else {
                html += name;
            }
            html += '</div> <div class="right list-item__subtitle">' + value.replace(/_/g, ' ') + '</div></ons-list-item>';
        }
        return html;
    }

    /**
     * Format a phone number correctly.
     * @param  {string} phone Phone number
     * @return {string} a element
     */
    formatPhone(phone) {
        return '<a href="tel:' + phone + '">' + phone.replace(/\s/g, '&nbsp;') + '</a>';
    }

    /**
     * Get a popup row containing the phone number.
     * @return {string} tr element
     */
    getPhoneRow() {
        const row = '';

        if (this.tags['contact:phone'] && !this.tags.phone) {
            this.tags.phone = this.tags['contact:phone'];
        }
        if (this.tags.phone) {
            return this.getPropertyRow(
                'Phone number',
                '<div>' + this.tags.phone.split(';').map(this.formatPhone).join('<br/>') + '</div>'
            );
        }

        return row;
    }

    /**
     * Get a popup row containing the website.
     * @return {string} tr element
     */
    getWebsiteRow() {
        let row = '';
        const url = L.DomUtil.create('a');

        if (this.tags['contact:website'] && !this.tags.website) {
            this.tags.website = this.tags['contact:website'];
        }
        if (this.tags.website) {
            url.href = this.tags.website;
            if (url.hostname === 'localhost') {
                this.tags.website = 'http://' + this.tags.website;
            }
            row = this.getPropertyRow('Website', '<a target="_blank" rel="noopener" href="' + this.tags.website + '">' + extractDomain(this.tags.website) + '</a>');
        }

        return row;
    }

    /**
     * Get a popup row containing the address.
     * @return {string} tr element
     */
    getAddressRow() {
        let street = '';
        const address = new PostalAddress();

        if (this.tags['addr:housenumber']) {
            street += this.tags['addr:housenumber'] + ' ';
        }
        if (this.tags['addr:street']) {
            street += this.tags['addr:street'];
        }

        address.setAddress1(street);
        address.setCity(this.tags['addr:city']);
        address.setPostalCode(this.tags['addr:postcode']);
        address.setFormat({
            country: this.tags['addr:country'],
            type: 'business'
        });

        return this.getPropertyRow('Address', address.toString());
    }

    /**
     * Get rows to display in a marker popup.
     * @return {string} Set of tr elements
     */
    getPopupRows() {
        let rows = '';

        // Cuisine and food-related metadata.
        if (this.tags.cuisine) {
            rows += this.getPropertyRow('Cuisine', this.tags.cuisine.replace(/;/g, ', '), 'cuisine');
        }
        if (this.tags['diet:vegan']) {
            rows += this.getPropertyRow('Vegan', this.tags['diet:vegan'], 'diet:vegan');
        }
        if (this.tags['diet:vegetarian']) {
            rows += this.getPropertyRow('Vegetarian', this.tags['diet:vegetarian'], 'diet');
        }
        if (this.tags.takeaway) {
            rows += this.getPropertyRow('Take away', this.tags.takeaway, 'takeaway');
        }

        // Toilet facility metadata.
        if (this.tags.changing_table) {
            rows += this.getPropertyRow('Baby changing table', this.tags.changing_table, 'changing_table');
        }
        if (this.tags['toilets:access']) {
            rows += this.getPropertyRow('Toilet access policy', this.tags['toilets:access'], 'access');
        }
        if (this.tags['toilets:gender_segregated']) { // A rare but sometimes used tag.
            rows += this.getPropertyRow('Gender segregated toilets', this.tags['toilets:gender_segregated'], 'gender_segregated');
        }
        if (this.tags['toilets:unisex']) {
            rows += this.getPropertyRow('Unisex toilets', this.tags['toilets:unisex'], 'unisex');
        }
        if (this.tags['toilets:wheelchair']) {
            rows += this.getPropertyRow('Wheelchair accessible toilet', this.tags['toilets:wheelchair'], 'wheelchair');
        }

        // Basic information.
        rows += this.getAddressRow() +
            this.getPhoneRow() +
            this.getWebsiteRow() +
            this.getOpeningHoursBtn() +
            this.getDescriptionBtn();

        return rows;
    }
}
