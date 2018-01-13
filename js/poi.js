function POI(tags) {
    'use strict';

    var constructor = {
        tags: tags
    };

    /**
     * Check if a POI is OK for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isDiet(diet) {
        var key = 'diet:' + diet;
        if (constructor.tags[key] && (constructor.tags[key] === 'yes' || constructor.tags[key] === 'only')) {
            return true;
        }
        return false;
    }

    /**
     * Check if a POI is not OK for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isNotDiet(diet) {
        var key = 'diet:' + diet;
        if (constructor.tags[key] && constructor.tags[key] === 'no') {
            return true;
        }
        return false;
    }

    /**
     * Check if a POI serves only food intended for the specified diet.
     * @param  {string}  diet Diet (vegan, vegetarian)
     * @return {Boolean}
     */
    function isOnlyDiet(diet) {
        var key = 'diet:' + diet;
        if (constructor.tags[key] && constructor.tags[key] === 'only') {
            return true;
        }
        return false;
    }


    /**
     * Get the map layer in which a POI should be added.
     * @return {string} Layer name
     */
    function getLayer() {
        if (constructor.isOnlyDiet('vegan')) {
            return 'vegan-only';
        }
        if (constructor.isDiet('vegan')) {
            return 'vegan';
        }
        if (constructor.isOnlyDiet('vegetarian')) {
            return 'vegetarian-only';
        }
        if (constructor.isDiet('vegetarian')) {
            return 'vegetarian';
        }
        return 'other';
    }

    /**
     * Get the correct color for the marker of a POI.
     * @return {string} Color name
     */
    function getColor() {
        if (constructor.isDiet('vegan')) {
            return 'green';
        }
        if (constructor.isDiet('vegetarian')) {
            return 'darkgreen';
        }
        if (constructor.isNotDiet('vegetarian')) {
            return 'red';
        }
        return 'gray';
    }

    /**
     * Get the correct icon for the marker of a POI.
     * @return {string} Font Awesome icon name
     */
    function getMarkerIcon() {
        if (constructor.isOnlyDiet('vegan')) {
            return 'dot-circle-o';
        }
        if (constructor.isDiet('vegan')) {
            return 'circle';
        }
        if (constructor.isDiet('vegetarian')) {
            return 'circle-o';
        }
        if (constructor.isNotDiet('vegetarian')) {
            return 'ban';
        }
        return 'question';
    }

    constructor.getMarkerIcon = getMarkerIcon;
    constructor.getColor = getColor;
    constructor.getLayer = getLayer;
    constructor.isOnlyDiet = isOnlyDiet;
    constructor.isDiet = isDiet;
    constructor.isNotDiet = isNotDiet;

    return constructor;
}

module.exports = POI;
