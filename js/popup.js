import L from 'leaflet';
import OH from 'opening_hours';
import PostalAddress from 'i18n-postal-address';
import extractDomain from 'extract-domain';

export default class Popup {

    /**
     * Popup class constructor.
     * @param {Object} tags POI tags
     * @constructor
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
                const oh = new OH(this.tags.opening_hours, null);

                return '<ons-list-item id="hoursBtn" data-dialog="hoursPopup" tappable modifier="chevron nodivider"><div class="left">Opening hours<br/>(' + oh.getStateString(new Date(), true) + ')</div></ons-list-item>';
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
     * @return {string} ons-list-item element
     */
    getPropertyRow(name, value) {
        if (value) {
            return '<ons-list-item modifier="nodivider"><div class="left list-item__title">' + name + '</div> <div class="right list-item__subtitle">' + value.replace(/_/g, ' ') + '</div></ons-list-item>';
        }
        return '';
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
        let rows = this.getPropertyRow('Vegan', this.tags['diet:vegan']) +
            this.getPropertyRow('Vegetarian', this.tags['diet:vegetarian']);

        if (this.tags.cuisine) {
            rows += this.getPropertyRow('Cuisine', this.tags.cuisine.replace(/;/g, ', '));
        }

        rows += this.getPropertyRow('Take away', this.tags.takeaway) +
            this.getAddressRow() +
            this.getPhoneRow() +
            this.getWebsiteRow() +
            this.getOpeningHoursBtn() +
            this.getDescriptionBtn();

        return rows;
    }
}
