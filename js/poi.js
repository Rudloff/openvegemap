/*jslint browser, node, es6*/

/**
 * POI class constructor.
 * @param {Object} tags POI tags
 * @constructor
 * @returns {Object} POI object
 */
function POI(tags) {
    'use strict';

    /**
     * Check if a POI is OK for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isDiet(diet) {
        const key = 'diet:' + diet;
        return !!(tags[key] && (tags[key] === 'yes' || tags[key] === 'only'));
    }

    /**
     * Check if a POI is not OK for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isNotDiet(diet) {
        const key = 'diet:' + diet;
        return !!(tags[key] && tags[key] === 'no');
    }

    /**
     * Check if a POI serves only food intended for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isOnlyDiet(diet) {
        const key = 'diet:' + diet;
        return !!(tags[key] && tags[key] === 'only');
    }

    /**
     * Check if a POI is a shop.
     * @return {Boolean}
     */
    function isShop() {
        return !!tags.shop;
    }

    /**
     * Get the map layer in which a POI should be added.
     * @return {string} Layer name
     */
    function getLayer() {
        if (isOnlyDiet('vegan')) {
            return 'vegan-only';
        }
        if (isDiet('vegan')) {
            return 'vegan';
        }
        if (isOnlyDiet('vegetarian')) {
            return 'vegetarian-only';
        }
        if (isDiet('vegetarian')) {
            return 'vegetarian';
        }

        return 'other';
    }

    /**
     * Get the correct color for the marker of a POI.
     * @return {string} Color name
     */
    function getColor() {
        if (isDiet('vegan')) {
            return 'green';
        }
        if (isDiet('vegetarian')) {
            return 'darkgreen';
        }
        if (isNotDiet('vegetarian')) {
            return 'red';
        }
        return 'gray';
    }

    /**
     * Get the correct icon for the marker of a POI.
     * @return {string} Font Awesome icon name
     */
    function getMarkerIcon() {
        if (isOnlyDiet('vegan')) {
            return 'bullseye';
        }
        if (isDiet('vegan')) {
            return 'circle';
        }
        if (isOnlyDiet('vegetarian')) {
            return 'circle-notch';
        }
        if (isDiet('vegetarian')) {
            return 'dot-circle';
        }
        if (isNotDiet('vegetarian')) {
            return 'ban';
        }
        return 'question';
    }


    /**
     * Get the correct icon for a shop POI.
     * @return {string} Emoji
     */
    function getShopIcon() {
        switch (tags.shop) {
        case 'bakery':
            return '🥖';
        default:
            return '🛒';
        }
    }

    /**
     * Get the correct icon for a craft POI.
     * @return {string} Emoji
     */
    function getCraftIcon() {
        switch (tags.craft) {
        case 'caterer':
            return '🍴';
        default:
            return '';
        }
    }

    /**
     * Get the correct icon for an amenity POI.
     * @return {string} Emoji
     */
    function getAmenityIcon() {
        switch (tags.amenity) {
        case 'fast_food':
            return '🍔';
        case 'restaurant':
            return '🍴';
        case 'cafe':
            return '🍵';
        case 'bar':
            return '🍸';
        case 'pub':
            return '🍺';
        case 'vending_machine':
            return 'Vending machine';
        default:
            return '';
        }
    }

    /**
     * Get the correct icon for a POI.
     * @return {string} Emoji
     */
    function getIcon() {
        if (tags.shop) {
            return getShopIcon();
        }
        if (tags.craft) {
            return getCraftIcon();
        }
        if (tags.amenity) {
            return getAmenityIcon();
        }
        return '';
    }

    return {
        getMarkerIcon: getMarkerIcon,
        getColor: getColor,
        getLayer: getLayer,
        getIcon: getIcon,
        isShop: isShop
    };
}

module.exports = POI;
