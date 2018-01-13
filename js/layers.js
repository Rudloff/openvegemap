/*jslint browser: true, node: true*/
/*global window*/

if (typeof window !== 'object') {
    throw 'OpenVegeMap must be used in a browser.';
}

var L = require('leaflet');

/**
 * layers module constructor.
 * @return {Object} openingHours module
 */
function layers() {
    'use strict';

    var layerNames = ['vegan-only', 'vegan', 'vegetarian-only', 'vegetarian', 'other'],
        layerObjects = {},
        map;

    /**
     * Get the currently enabled filters.
     * @return {Array} Filters
     */
    function getCurFilter() {
        var curFilters = JSON.parse(localStorage.getItem('filters'));
        if (!curFilters) {
            curFilters = ['vegan', 'vegan-only', 'vegetarian', 'vegetarian-only'];
        }
        return curFilters;
    }


    /**
     * Remove a layer from the map.
     * @param  {string} layerName Layer name
     * @return {Void}
     */
    function removeLayer(layerName) {
        layerObjects[layerName].removeFrom(map);
    }

    /**
     * Add a layer to the map.
     * @param {string} layerName Layer name
     */
    function setFilter(layerName) {
        layerObjects[layerName].addTo(map);
    }

    /**
     * Apply the currently enabled filters.
     * @return {Void}
     */
    function applyFilters() {
        var activeFilters = [];
        layerNames.forEach(removeLayer);
        layerNames.forEach(function (layer) {
            var checkbox = L.DomUtil.get(layer + '-filter');
            if (checkbox && checkbox.checked) {
                activeFilters.push(layer);
            }
        });
        activeFilters.forEach(setFilter);
        localStorage.setItem('filters', JSON.stringify(activeFilters));
    }

    /**
     * Create a new layer.
     * @param  {string} layerName Layer name
     * @return {Object} Layer
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createLayer(layerName) {
        layerObjects[layerName] = L.layerGroup();
    }

    /**
     * Add a marker to a layer
     * @param {Object} marker    Leaflet marker
     * @param {string} layerName Layer name
     */
    function addMarker(marker, layerName) {
        console.log(marker);
        marker.addTo(layerObjects[layerName]);
    }

    /**
     * Create all the needed layers.
     * @param {Object} newMap Leaflet map
     * @return {Void}
     */
    function createLayers(newMap) {
        map = newMap;
        layerNames.forEach(createLayer);
    }

    return {
        createLayers: createLayers,
        getCurFilter: getCurFilter,
        applyFilters: applyFilters,
        setFilter: setFilter,
        addMarker: addMarker
    };
}

module.exports = layers();
