/*jslint browser: true, node: true*/
/*global window, localStorage*/
/*property
    AwesomeMarkers, Control, DomEvent, DomUtil, Geocoder, Nominatim,
    OverPassLayer, Permalink, UrlUtil, _alts, _container, _errorElement,
    _geocode, _input, addControl, addTo, advance, afterRequest, amenity,
    attribution, beforeRequest, bindTooltip, center, checked, circle, close,
    content, control, craft, create, createAlertDialog, cuisine,
    defaultMarkGeocode, detectRetina, dialog, direction, elements,
    enableHighAccuracy, endPoint, endsWith, feature, filtersDialog, fitBounds,
    forEach, geocode, geocodeDialog, geocoder, get, getAttribute, getBounds,
    getDate, getDay, getElementsByName, getHours, getItem, getIterator,
    getMinutes, getMonth, getState, getStateString, getZoom, hash, hide,
    hostname, href, icon, id, indexOf, init, innerHTML, lat, layerGroup,
    loader, localStorage, locate, lon, map, marker, markerColor, maxBounds,
    maxBoundsViscosity, maxNativeZoom, maxZoom, minZoom,
    minZoomIndicatorEnabled, name, on, onSuccess, open, opening_hours, other,
    padStart, phone, position, prefix, push, query, queryParse, ready,
    removeFrom, replace, serviceUrl, setAttribute, setDate, setHours, setIcon,
    setItem, setMinutes, setView, shop, show, some, tags, takeaway, target,
    then, tileLayer, toString, type, useLocalStorage, useLocation, vegan,
    vegetarian, website, zoom, zoomToast,
    toLocaleDateString, weekday, getTime, stringify, parse,
    google, openroute, graphhopper, value, keys, preferencesDialog,
    InfoControl, shim, currentTarget, dataset,
    getMarkerIcon, getColor, getLayer, getPopupRows
*/

if (typeof window !== 'object') {
    throw 'OpenVegeMap must be used in a browser.';
}

//Polyfills
var padStart = require('string.prototype.padstart');
padStart.shim();

var ons = require('onsenui'),
    L = require('leaflet'),
    OH = require('opening_hours');
require('leaflet-loader/leaflet-loader.js');
require('leaflet-plugins/control/Permalink.js');
require('leaflet-overpass-layer/dist/OverPassLayer.bundle.js');
require('leaflet-control-geocoder');
require('drmonty-leaflet-awesome-markers');
require('leaflet-info-control');

//CSS
require('leaflet/dist/leaflet.css');
require('onsenui/css/onsenui-core.css');
require('onsenui/css/onsen-css-components.css');
require('onsenui/css/font_awesome/css/font-awesome.css');
require('leaflet-loader/leaflet-loader.css');
require('drmonty-leaflet-awesome-markers/css/leaflet.awesome-markers.css');
require('leaflet-control-geocoder/dist/Control.Geocoder.css');

var oldbrowsers = require('./oldbrowser.js'),
    POI = require('./poi.js'),
    Popup = require('./popup.js');

function openvegemapMain() {
    'use strict';

    var map,
        controlLoader,
        curFeatures = [],
        menu,
        geocoder,
        layers = {},
        layerNames = ['vegan-only', 'vegan', 'vegetarian-only', 'vegetarian', 'other'],
        dialogs = {},
        dialogFunctions = {},
        zoomWarningDisplayed = false,
        dayInterval = 24 * 60 * 60 * 1000,
        weekInterval = dayInterval * 7,
        routingProviders = {
            google: 'https://www.google.com/maps/dir//{LAT},{LON}',
            graphhopper: 'https://graphhopper.com/maps/?point=&point={LAT},{LON}',
            openroute: 'https://openrouteservice.org/directions?a=null,null,{LAT},{LON}'
        };

    /**
     * Format an hour as HH:MM.
     * @param  {Date} date Date object
     * @return {string} Formatted date
     */
    function formatHour(date) {
        return date.getHours().toString().padStart(2, 0) + ':' + date.getMinutes().toString().padStart(2, 0);
    }

    /**
     * Return the weekday from a date.
     * @param  {Date} date Date object
     * @return {string} Formatted date
     */
    function formatDay(date) {
        return date.toLocaleDateString('en-US', {weekday: 'long'});
    }

    /**
     * Get a table row with closed days in the specified date interval.
     * @param  {Date} curDate  Current date in the loop
     * @param  {Date} prevDate Previous date in the loop
     * @return {string} Set of tr elements
     */
    function getClosedDates(curDate, prevDate) {
        var result = '';
        if (curDate - prevDate > dayInterval) {
            // If we advanced more than a day, it means we have to display one or more closed days
            var closedDate = prevDate;
            while (closedDate.getDay() < curDate.getDay()) {
                if (closedDate.getDay() === 1 || closedDate.getDay() > prevDate.getDay()) {
                    result += '<tr><th>' + formatDay(closedDate) + '</th><td colspan="2">Closed</td></tr>';
                }
                closedDate = new Date(closedDate.getTime() + dayInterval);
            }
        }
        return result;
    }

    /**
     * Get opening hours in the specified date interval.
     * @param  {Object} oh          opening_hours.js object
     * @param  {Date}   curDate     Current date in the loop
     * @param  {Date}   prevDate    Previous date in the loop
     * @param  {number} curDay      Current day in the loop
     * @param  {number} prevOpenDay Latest open day in the loop
     * @return {string} tr element
     */
    function getOpeningHoursRow(oh, curDate, prevDate, curDay, prevOpenDay) {
        var row = '';
        if (oh.getState(prevDate) && prevDate !== curDate) {
            row += '<tr><th>';
            if (prevOpenDay !== curDay) {
                row += formatDay(prevDate);
            }
            row += '</th><td>' + formatHour(prevDate) + '<td>' + formatHour(curDate) + '</td></tr>';
        }
        return row;
    }

    /**
     * Get a table containing opening hours.
     * @param  {string} value Value of the opening_hours tag
     * @return {string}       Set of tr elements
     */
    function getOpeningHoursTable(value) {
        var oh = new OH(value, null),
            it = oh.getIterator(),
            table = '',
            // We use a fake date to start a monday
            curDate = new Date(2017, 0, 2),
            prevDate = curDate,
            curDay,
            prevOpenDay = new Date(2017, 0, 1),
            endDate;
        it.setDate(curDate);
        endDate = new Date(curDate.getTime() + weekInterval);

        while (it.advance(endDate)) {
            curDate = it.getDate();
            curDay = prevDate.getDay();

            if (prevDate.getHours() !== 0 || prevDate.getMinutes() !== 0) {
                table += getOpeningHoursRow(oh, curDate, prevDate, curDay, prevOpenDay);
                table += getClosedDates(curDate, prevDate);

                if (oh.getState(prevDate) && prevOpenDay !== curDay) {
                    prevOpenDay = curDay;
                }
            }

            prevDate = curDate;
        }
        if (curDate.getDay() === 0) {
            //If the loop stopped on sunday, we might need to add another row
            it.advance();
            table += getOpeningHoursRow(oh, it.getDate(), curDate, prevDate.getDay(), prevOpenDay);
        } else {
            //If the loop stop before sunday, it means it is closed
            table += '<tr><th>Sunday</th><td colspan="2">Closed<td></tr>';
        }
        if (!table) {
            //Sometimes the opening hours data is in a format we don't support
            table += "<tr><th>Sorry, we don't have enough info</th></tr>";
        }
        return table;
    }

    /**
     * Open a dialog.
     * @param  {MousEvent} e Event that triggered the dialog
     * @return {Void}
     */
    function openDialog(e) {
        dialogs[e.currentTarget.dataset.dialog].show(e.currentTarget);
        if (dialogFunctions[e.currentTarget.dataset.dialog] && typeof dialogFunctions[e.currentTarget.dataset.dialog].show === 'function') {
            dialogFunctions[e.currentTarget.dataset.dialog].show();
        }
    }

    /**
     * Get the routing service URL for the specific coordinates.
     * @param  {number} lat Latitude
     * @param  {number} lon Longitude
     * @return {string} URL
     */
    function getRoutingUrl(lat, lon) {
        var url = localStorage.getItem('routing-provider');
        if (!url) {
            url = routingProviders.google;
        }

        if (lat) {
            url = url.replace('{LAT}', lat);
        }
        if (lon) {
            url = url.replace('{LON}', lon);
        }

        return url;
    }

    /**
     * Display a marker popup.
     * @param  {Object} e Leaflet DomEvent
     * @return {Void}
     */
    function showPopup(e) {
        var html = '',
            popup = new Popup(e.target.feature.tags);
        html += popup.getPopupRows();
        if (e.target.feature.tags.opening_hours) {
            L.DomUtil.get('hoursTable').innerHTML = getOpeningHoursTable(e.target.feature.tags.opening_hours);
        }
        if (!e.target.feature.tags.name) {
            e.target.feature.tags.name = '';
        }
        L.DomUtil.get('mapPopupTitle').innerHTML = e.target.feature.tags.name;
        L.DomUtil.get('mapPopupList').innerHTML = html;
        L.DomUtil.get('gmapsLink').setAttribute('href', getRoutingUrl(e.target.feature.lat, e.target.feature.lon));
        L.DomUtil.get('editLink').setAttribute('href', 'https://editor.openvegemap.netlib.re/' + e.target.feature.type + '/' + e.target.feature.id);
        if (e.target.feature.tags.opening_hours) {
            var hoursBtn = L.DomUtil.get('hoursBtn');
            L.DomEvent.on(hoursBtn, 'click', openDialog);
        }
        L.DomUtil.get('mapPopup').show();
    }

    /**
     * Get the correct icon for a shop POI.
     * @param  {Object} tags POI tags
     * @return {string} Emoji
     */
    function getShopIcon(tags) {
        switch (tags.shop) {
        case 'bakery':
            return '🥖';
        default:
            return '🛒';
        }
    }

    /**
     * Get the correct icon for a craft POI.
     * @param  {Object} tags POI tags
     * @return {string} Emoji
     */
    function getCraftIcon(tags) {
        switch (tags.craft) {
        case 'caterer':
            return '🍴';
        default:
            return '';
        }
    }

    /**
     * Get the correct icon for an amenity POI.
     * @param  {Object} tags POI tags
     * @return {string} Emoji
     */
    function getAmenityIcon(tags) {
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
        default:
            return '';
        }
    }

    /**
     * Get the correct icon for a POI.
     * @param  {Object} tags POI tags
     * @return {string} Emoji
     */
    function getIcon(tags) {
        if (tags.shop) {
            return getShopIcon(tags);
        }
        if (tags.craft) {
            return getCraftIcon(tags);
        }
        if (tags.amenity) {
            return getAmenityIcon(tags);
        }
        return '';
    }

    /**
     * Add a marker to the map.
     * @param {Object} feature POI
     */
    function addMarker(feature) {
        if (curFeatures.indexOf(feature.id) === -1) {
            curFeatures.push(feature.id);
            if (feature.center) {
                feature.lat = feature.center.lat;
                feature.lon = feature.center.lon;
            }
            var poi = new POI(feature.tags),
                marker = L.marker([feature.lat, feature.lon]);
            marker.feature = feature;
            marker.setIcon(L.AwesomeMarkers.icon({
                icon: poi.getMarkerIcon(),
                prefix: 'fa',
                markerColor: poi.getColor()
            }));
            marker.on('click', showPopup);
            if (feature.tags.name) {
                marker.bindTooltip(getIcon(feature.tags) + '&nbsp;' + feature.tags.name, {direction: 'bottom'});
            }
            marker.addTo(layers[poi.getLayer()]);
        }
    }

    /**
     * Hide the loader.
     * @return {Void}
     */
    function hideLoader() {
        controlLoader.hide();
    }

    /**
     * Show the loader.
     * @return {Void}
     */
    function showLoader() {
        controlLoader.show();
    }

    /**
     * Open the main menu.
     * @return {Void}
     */
    function openMenu() {
        menu.open();
    }

    /**
     * Move the map to the location of the user.
     * @return {Void}
     */
    function locateMe() {
        map.locate({setView: true, enableHighAccuracy: true});
        menu.close();
    }

    /**
     * Start the geocoder.
     * @return {Void}
     */
    function geocode() {
        geocoder._geocode();
    }

    /**
     * Add a circle on the map at the coordinates returned by the geocoder.
     * @param {Object} e Object returned by the markgeocode event
     */
    function addGeocodeMarker(e) {
        var circle = L.circle(e.geocode.center, 10);
        circle.addTo(map);
        map.fitBounds(circle.getBounds());
        dialogs.geocodeDialog.hide();
        menu.close();
    }

    /**
     * Add markers toe the map.
     * @param {Object} data Data returned by the Overpass API
     */
    function addMarkers(data) {
        data.elements.forEach(addMarker);
    }

    /**
     * Initialize a dialog.
     * @param  {Element} dialog Dialog element
     * @return {Void}
     */
    function initDialog(dialog) {
        dialogs[dialog.id] = dialog;
        if (dialogFunctions[dialog.id] && typeof dialogFunctions[dialog.id].init === 'function') {
            dialogFunctions[dialog.id].init();
        }
    }

    /**
     * Remove a layer from the map.
     * @param  {string} layer Layer name
     * @return {Void}
     */
    function removeLayer(layer) {
        layers[layer].removeFrom(map);
    }

    /**
     * Add a layer to the map.
     * @param {string} layer Layer name
     */
    function setFilter(layer) {
        layers[layer].addTo(map);
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
        dialogs.filtersDialog.hide();
        menu.close();
    }

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
     * Create a new layer.
     * @param  {string} layer Layer name
     * @return {Object} Layer
     * @see http://leafletjs.com/reference-1.2.0.html#layergroup
     */
    function createLayer(layer) {
        layers[layer] = L.layerGroup();
    }

    /**
     * Create all the needed layers.
     * @return {Void}
     */
    function createLayers() {
        layerNames.forEach(createLayer);
    }

    /**
     * Display a warning if the current zoom level is too low.
     * @param  {Object} e Object returned by the zoom event
     * @return {Void}
     */
    function checkZoomLevel(e) {
        var zoom = e.target.getZoom();
        if (zoom >= 15 && zoomWarningDisplayed) {
            dialogs.zoomToast.hide();
            zoomWarningDisplayed = false;
        } else if (zoom < 15 && !zoomWarningDisplayed) {
            dialogs.zoomToast.show();
            zoomWarningDisplayed = true;
        }
    }

    /**
     * Initialize the geocoder dialog.
     * @return {Void}
     */
    function geocodeDialogInit() {
        geocoder = new L.Control.Geocoder(
            {
                geocoder: new L.Control.Geocoder.Nominatim({serviceUrl: 'https://nominatim.openstreetmap.org/'}),
                position: 'topleft',
                defaultMarkGeocode: false
            }
        ).on('markgeocode', addGeocodeMarker);
        geocoder._alts = L.DomUtil.get('geocodeAlt');
        geocoder._container = dialogs.geocodeDialog;
        geocoder._errorElement = L.DomUtil.get('geocodeError');
        geocoder._input = L.DomUtil.get('geocodeInput');
        L.DomEvent.on(L.DomUtil.get('geocodeDialogBtn'), 'click', geocode);
    }

    /**
     * Initialize the filters dialog.
     * @return {Void}
     */
    function filtersDialogInit() {
        L.DomEvent.on(L.DomUtil.get('filtersDialogBtn'), 'click', applyFilters);
    }

    /**
     * Check the checkbox for the specified filter in the filters dialog.
     * @param  {string} layer Layer name
     * @return {Void}
     */
    function filtersDialogCheckbox(layer) {
        L.DomUtil.get(layer + '-filter').checked = true;
    }

    /**
     * Function called when displaying the filters dialog.
     * @return {Void}
     */
    function filtersDialogShow() {
        getCurFilter().forEach(filtersDialogCheckbox);
    }

    /**
     * Set the routing provider from the preferences.
     */
    function setRoutingProvider() {
        var curProvider = routingProviders.google;
        if (L.DomUtil.get('custom-routingprovider').checked) {
            curProvider = L.DomUtil.get('custom-routingprovider-url').value;
        }
        Object.keys(routingProviders).some(function (provider) {
            if (L.DomUtil.get(provider + '-routingprovider').checked) {
                curProvider = routingProviders[provider];

                return true;
            }

            return false;
        });

        localStorage.setItem('routing-provider', curProvider);
        dialogs.preferencesDialog.hide();
        menu.close();
    }

    /**
     * Initialize the preferences dialog.
     * @return {Void}
     */
    function preferencesDialogInit() {
        L.DomEvent.on(L.DomUtil.get('preferencesDialogBtn'), 'click', setRoutingProvider);
    }

    /**
     * Function called when displaying the preferences dialog.
     * @return {Void}
     */
    function preferencesDialogShow() {
        var url = localStorage.getItem('routing-provider'),
            curProvider;
        Object.keys(routingProviders).some(function (provider) {
            if (url === routingProviders[provider]) {
                curProvider = provider;

                return true;
            }

            return false;
        });
        if (!curProvider && url) {
            L.DomUtil.get('custom-routingprovider-url').value = url;
            curProvider = 'custom';
        }
        if (!curProvider) {
            curProvider = 'google';
        }
        L.DomUtil.get(curProvider + '-routingprovider').checked = true;
    }

    /**
     * Initialize the zoom level warning toast.
     * @return {Void}
     */
    function zoomToastInit() {
        checkZoomLevel({target: map});
    }

    /**
     * Initialize the app.
     * @return {Void}
     */
    function init() {
        //Variables
        menu = L.DomUtil.get('menu');
        map = L.map(
            'map',
            {
                center: [48.85661, 2.351499],
                zoom: 16,
                maxZoom: 19,
                minZoom: 3,
                maxBounds: [[-90, -180], [90, 180]],
                maxBoundsViscosity: 1
            }
        );
        controlLoader = L.control.loader().addTo(map);
        var hash = L.UrlUtil.hash();

        //Events
        L.DomEvent.on(L.DomUtil.get('menuBtn'), 'click', openMenu);
        L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('filtersMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('preferencesMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);
        L.DomEvent.on(L.DomUtil.get('aboutMenuItem'), 'click', openDialog);

        //Tiles
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            maxNativeZoom: 18,
            maxZoom: 20,
            attribution: '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a target="_blank" href="https://maps.wikimedia.org/">Wikimedia maps</a>'
        }).addTo(map);

        //Permalink
        if (L.UrlUtil.queryParse(hash).lat) {
            //Don't use localStorage value if we have a hash in the URL
            localStorage.setItem('paramsTemp', hash);
        }
        map.addControl(new L.Control.Permalink({useLocation: true, useLocalStorage: true}));

        //Legend
        map.addControl(
            new L.Control.InfoControl(
                {
                    position: 'bottomright',
                    content: '<i class="fa fa-circle" style="background-color: #72AF26"></i> Vegan<br/>'
                            + '<i class="fa fa-dot-circle-o" style="background-color: #72AF26"></i> Vegan only<br/>'
                            + '<i class="fa fa-circle-o" style="background-color: #728224"></i> Vegetarian<br/>'
                            + '<i class="fa fa-ban" style="background-color: #D63E2A"></i> Meat only<br/>'
                            + '<i class="fa fa-question" style="background-color: #575757"></i> Unknown<br/>'
                }
            )
        );

        //Overpass
        var overpassLayer = new L.OverPassLayer({
            endPoint: 'https://overpass-api.de/api/',
            query: 'node({{bbox}})[~"^diet:.*$"~"."];out;way({{bbox}})[~"^diet:.*$"~"."];out center;',
            beforeRequest: showLoader,
            afterRequest: hideLoader,
            onSuccess: addMarkers,
            minZoomIndicatorEnabled: false
        });
        overpassLayer.addTo(map);

        //Layers control
        createLayers();
        getCurFilter().forEach(setFilter);

        //Dialog functions
        dialogFunctions = {
            geocodeDialog: {
                init: geocodeDialogInit
            },
            filtersDialog: {
                init: filtersDialogInit,
                show: filtersDialogShow
            },
            preferencesDialog: {
                init: preferencesDialogInit,
                show: preferencesDialogShow
            },
            zoomToast: {
                init: zoomToastInit
            }
        };

        //Dialogs
        ons.createAlertDialog('templates/about.html').then(initDialog);
        ons.createAlertDialog('templates/geocode.html').then(initDialog);
        ons.createAlertDialog('templates/filters.html').then(initDialog);
        ons.createAlertDialog('templates/preferences.html').then(initDialog);
        ons.createAlertDialog('templates/popup.html').then(initDialog);
        ons.createAlertDialog('templates/zoom.html').then(initDialog);
        ons.createAlertDialog('templates/hours.html').then(initDialog);

        //Map events
        map.on('zoom', checkZoomLevel);
    }

    return {
        init: init
    };
}

var openvegemap = openvegemapMain();

if (typeof ons === 'object') {
    ons.ready(openvegemap.init);
    ons.ready(oldbrowsers.init);
} else {
    throw 'Onsen is not loaded';
}
