/*jslint browser, node, es6*/
/*global window, localStorage*/

if (typeof window !== 'object') {
    throw new Error('OpenVegeMap must be used in a browser.');
}

const L = require('leaflet');

/**
 * layers module constructor.
 * @return {Object} layers module
 */
function layers() {
    'use strict';

    const layerNames = ['vegan-only', 'vegan', 'vegetarian-only', 'vegetarian', 'other', 'shop'];
    let layerObjects = {};
    const shopLayerObjects = {};
    let map;

    /**
     * Get the currently enabled filters.
     * @return {Array} Filters
     */
    function getCurFilter() {
        let curFilters = JSON.parse(localStorage.getItem('filters'));
        if (!curFilters) {
            curFilters = ['vegan', 'vegan-only', 'vegetarian', 'vegetarian-only'];
        }
        return curFilters;
    }


    /**
     * Remove a layer from the map.
     * @param  {string} layerName Layer name
     * @return {void}
     */
    function removeLayer(layerName) {
        layerObjects[layerName].removeFrom(map);
    }

    /**
     * Remove a shop layer from the map.
     * @param  {string} layerName Layer name
     * @return {void}
     */
    function removeShopLayer(layerName) {
        shopLayerObjects[layerName].removeFrom(map);
    }

    /**
     * Add a layer to the map.
     * @param {string} layerName Layer name
     * @return {void}
     */
    function setFilter(layerName) {
        layerObjects[layerName].addTo(map);
    }

    /**
     * Add a shop layer to the map.
     * @param {string} layerName Layer name
     * @return {void}
     */
    function setShopFilter(layerName) {
        shopLayerObjects[layerName].addTo(map);
    }

    /**
     * Apply the currently enabled filters.
     * @return {void}
     */
    function applyFilters() {
        const activeFilters = [];
        layerNames.forEach(removeLayer);
        layerNames.forEach(removeShopLayer);
        layerNames.forEach(function (layer) {
            const checkbox = L.DomUtil.get(layer + '-filter');
            if (checkbox && checkbox.checked) {
                activeFilters.push(layer);
            }
        });
        activeFilters.forEach(setFilter);
        localStorage.setItem('filters', JSON.stringify(activeFilters));

        const shopCheckbox = L.DomUtil.get('shop-filter');
        if (shopCheckbox && shopCheckbox.checked) {
            activeFilters.forEach(setShopFilter);
        }
    }

    /**
     * Create a new layer.
     * @param  {string} layerName Layer name
     * @return {void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createLayer(layerName) {
        layerObjects[layerName] = L.layerGroup();
    }

    /**
     * Create a new shop layer.
     * @param  {string} layerName Layer name
     * @return {void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createShopLayer(layerName) {
        shopLayerObjects[layerName] = L.layerGroup();
    }

    /**
     * Add a marker to a layer
     * @param {Object} marker    Leaflet marker
     * @param {string} layerName Layer name
     * @param {bool} shop Is this a shop?
     * @return {void}
     */
    function addMarker(marker, layerName, shop) {
        let objects;
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
     * @return {void}
     */
    function createLayers(newMap) {
        map = newMap;
        layerNames.forEach(createLayer);
        layerNames.forEach(createShopLayer);
    }

    /**
     * Reapply filters.
     * @return {void}
     */
    function refreshFilters() {
        layerNames.forEach(removeLayer);

        const curFilters = getCurFilter();
        curFilters.forEach(setFilter);

        if (curFilters.includes('shop')) {
            curFilters.forEach(setShopFilter);
        }
    }

    /**
     * Delete and recreate layers.
     * @return {void}
     */
    function clearLayers() {
        // Delete layers.
        layerNames.forEach(removeLayer);
        layerObjects = [];

        // Recreate them.
        createLayers(map);

        // Re-apply filters.
        refreshFilters();
    }

    return {
        createLayers: createLayers,
        getCurFilter: getCurFilter,
        applyFilters: applyFilters,
        setFilter: setFilter,
        setShopFilter: setShopFilter,
        addMarker: addMarker,
        clearLayers: clearLayers,
        refreshFilters: refreshFilters
    };
}

module.exports = layers();
