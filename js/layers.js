import L from 'leaflet';

export default class layers {

    /**
     * Get layer names
     * @returns {string[]}
     */
    static getLayerNames() {
        return ['vegan-only', 'vegan', 'vegetarian-only', 'vegetarian', 'other', 'shop'];
    }

    /**
     * Get the currently enabled filters.
     * @return {Array} Filters
     */
    static getCurFilter() {
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
    static removeLayer(layerName) {
        this.layerObjects[layerName].removeFrom(this.map);
    }

    /**
     * Remove a shop layer from the map.
     * @param  {string} layerName Layer name
     * @return {void}
     */
    static removeShopLayer(layerName) {
        this.shopLayerObjects[layerName].removeFrom(this.map);
    }

    /**
     * Add a layer to the map.
     * @param {string} layerName Layer name
     * @return {void}
     */
    static setFilter(layerName) {
        this.layerObjects[layerName].addTo(this.map);
    }

    /**
     * Add a shop layer to the map.
     * @param {string} layerName Layer name
     * @return {void}
     */
    static setShopFilter(layerName) {
        this.shopLayerObjects[layerName].addTo(this.map);
    }

    /**
     * Apply the currently enabled filters.
     * @return {void}
     */
    static applyFilters() {
        const activeFilters = [];
        this.getLayerNames().forEach(this.removeLayer, this);
        this.getLayerNames().forEach(this.removeShopLayer, this);
        this.getLayerNames().forEach(function (layer) {
            const checkbox = L.DomUtil.get(layer + '-filter');
            if (checkbox && checkbox.checked) {
                activeFilters.push(layer);
            }
        }, this);
        activeFilters.forEach(this.setFilter, this);
        localStorage.setItem('filters', JSON.stringify(activeFilters));

        const shopCheckbox = L.DomUtil.get('shop-filter');
        if (shopCheckbox && shopCheckbox.checked) {
            activeFilters.forEach(this.setShopFilter, this);
        }
    }

    /**
     * Create a new layer.
     * @param  {string} layerName Layer name
     * @return {void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    static createLayer(layerName) {
        this.layerObjects[layerName] = L.layerGroup();
    }

    /**
     * Create a new shop layer.
     * @param  {string} layerName Layer name
     * @return {void}
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    static createShopLayer(layerName) {
        this.shopLayerObjects[layerName] = L.layerGroup();
    }

    /**
     * Add a marker to a layer
     * @param {Object} marker    Leaflet marker
     * @param {string} layerName Layer name
     * @param {Boolean} shop Is this a shop?
     * @return {void}
     */
    static addMarker(marker, layerName, shop) {
        let objects;
        if (shop) {
            objects = this.shopLayerObjects;
        } else {
            objects = this.layerObjects;
        }

        marker.addTo(objects[layerName]);
    }

    /**
     * Create all the needed layers.
     * @param {Object} newMap Leaflet map
     * @return {void}
     */
    static createLayers(newMap) {
        this.map = newMap;
        this.layerObjects = {};
        this.shopLayerObjects = {};
        this.getLayerNames().forEach(this.createLayer, this);
        this.getLayerNames().forEach(this.createShopLayer, this);
    }

    /**
     * Reapply filters.
     * @return {void}
     */
    static refreshFilters() {
        this.getLayerNames().forEach(this.removeLayer, this);

        const curFilters = this.getCurFilter();
        curFilters.forEach(this.setFilter, this);

        if (curFilters.includes('shop')) {
            curFilters.forEach(this.setShopFilter, this);
        }
    }

    /**
     * Delete and recreate layers.
     * @return {void}
     */
    static clearLayers() {
        // Delete layers.
        this.getLayerNames().forEach(this.removeLayer, this);
        this.layerObjects = [];

        // Recreate them.
        this.createLayers(this.map);

        // Re-apply filters.
        this.refreshFilters();
    }
}
