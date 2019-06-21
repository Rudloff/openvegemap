/*jslint browser: true, node: true*/
/*global window, localStorage*/

if (typeof window !== 'object') {
    throw new Error('OpenVegeMap must be used in a browser.');
}

var L = require('leaflet');

/**
 * layers module constructor.
 * @return {Object} layers module
 */
function layers() {
    'use strict';

    var layerNames = ['vegan-only', 'vegan', 'vegetarian-only', 'vegetarian', 'other', 'shop'],
        layerObjects = {},
        shopLayerObjects = {},
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
     * Remove a shop layer from the map.
     * @param  {string} layerName Layer name
     * @return {Void}
     */
    function removeShopLayer(layerName) {
        shopLayerObjects[layerName].removeFrom(map);
    }

    /**
     * Add a layer to the map.
     * @param {string} layerName Layer name
     * @return {Void}
     */
    function setFilter(layerName) {
        layerObjects[layerName].addTo(map);
    }

    /**
     * Add a shop layer to the map.
     * @param {string} layerName Layer name
     * @return {Void}
     */
    function setShopFilter(layerName) {
        shopLayerObjects[layerName].addTo(map);
    }

    /**
     * Apply the currently enabled filters.
     * @return {Void}
     */
    function applyFilters() {
        var activeFilters = [];
        layerNames.forEach(removeLayer);
        layerNames.forEach(removeShopLayer);
        layerNames.forEach(function (layer) {
            var checkbox = L.DomUtil.get(layer + '-filter');
            if (checkbox && checkbox.checked) {
                activeFilters.push(layer);
            }
        });
        activeFilters.forEach(setFilter);
        localStorage.setItem('filters', JSON.stringify(activeFilters));

        var shopCheckbox = L.DomUtil.get('shop-filter');
        if (shopCheckbox && shopCheckbox.checked) {
            activeFilters.forEach(setShopFilter);
        }
    }

    /**
     * Create a new layer.
     * @param  {string} layerName Layer name
     * @return {Void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createLayer(layerName) {
        layerObjects[layerName] = L.layerGroup();
    }

    /**
     * Create a new shop layer.
     * @param  {string} layerName Layer name
     * @return {Void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createShopLayer(layerName) {
        shopLayerObjects[layerName] = L.layerGroup();
    }

    /**
     * Add a marker to a layer
     * @param {Object} marker    Leaflet marker
     * @param {string} layerName Layer name
     * @return {Void}
     */
    function addMarker(marker, layerName, shop) {
        var objects;
        if (shop) {
            objects = shopLayerObjects;
        } else {
            objects = layerObjects;
        }

        marker.addTo(objects[layerName]);
    }

    /**
     * Create all the needed layers.
     * @param {Object} newMap Leaflet map
     * @return {Void}
     */
    function createLayers(newMap) {
        map = newMap;
        layerNames.forEach(createLayer);
        layerNames.forEach(createShopLayer);
    }

    return {
        createLayers: createLayers,
        getCurFilter: getCurFilter,
        applyFilters: applyFilters,
        setFilter: setFilter,
        setShopFilter: setShopFilter,
        addMarker: addMarker
    };
}

module.exports = layers();
