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
    getMarkerIcon, getColor, getLayer, getPopupRows, getIcon, getOpeningHoursTable,
    applyFilters, getCurFilter, createLayers, setFilter, addMarker,
    callback
*/

if (typeof window !== 'object') {
    throw 'OpenVegeMap must be used in a browser.';
}

//Polyfills
var padStart = require('string.prototype.padstart');
padStart.shim();

var ons = require('onsenui'),
    L = require('leaflet');
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
    openingHours = require('./opening_hours.js'),
    layers = require('./layers.js'),
    POI = require('./poi.js'),
    Popup = require('./popup.js');

/**
 * Main module constructor.
 * @return {Object} Main module
 */
function openvegemapMain() {
    'use strict';

    var map,
        controlLoader,
        curFeatures = [],
        menu,
        geocoder,
        dialogs = {},
        dialogFunctions = {},
        zoomWarningDisplayed = false,
        routingProviders = {
            google: 'https://www.google.com/maps/dir//{LAT},{LON}',
            graphhopper: 'https://graphhopper.com/maps/?point=&point={LAT},{LON}',
            openroute: 'https://openrouteservice.org/directions?a=null,null,{LAT},{LON}'
        };

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
            L.DomUtil.get('hoursTable').innerHTML = openingHours.getOpeningHoursTable(e.target.feature.tags.opening_hours);
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
                marker.bindTooltip(poi.getIcon() + '&nbsp;' + feature.tags.name, {direction: 'bottom'});
            }
            layers.addMarker(marker, poi.getLayer());
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
     * Move the map to the location of the user.
     * @return {Void}
     */
    function locateMe() {
        map.locate({setView: true, enableHighAccuracy: true});
        menu.close();
    }

    /**
     * Initilize menu buttons
     * @return {Void}
     */
    function initMenu() {
        //We should probably initialize this when the template is loaded instead.
        L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('filtersMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('preferencesMenuItem'), 'click', openDialog);
        L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);
        L.DomEvent.on(L.DomUtil.get('aboutMenuItem'), 'click', openDialog);
    }

    /**
     * Open the main menu.
     * @return {Void}
     */
    function openMenu() {
        menu.open({callback: initMenu});
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
     * Display a warning if the current zoom level is too low.
     * @param  {Object} e Object returned by the zoom event
     * @return {Void}
     */
    function checkZoomLevel(e) {
        var zoom = e.target.getZoom();
        if (zoom >= 13 && zoomWarningDisplayed) {
            dialogs.zoomToast.hide();
            zoomWarningDisplayed = false;
        } else if (zoom < 13 && !zoomWarningDisplayed) {
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
     * Function called when the apply button in the filters dialog is clicked
     * @return {Void}
     */
    function applyFilters() {
        layers.applyFilters();
        dialogs.filtersDialog.hide();
        menu.close();
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
        layers.getCurFilter().forEach(filtersDialogCheckbox);
    }

    /**
     * Set the routing provider from the preferences.
     * @return {Void}
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

        //Menu
        L.DomEvent.on(L.DomUtil.get('menuBtn'), 'click', openMenu);

        //Tiles
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            maxNativeZoom: 18,
            maxZoom: 20,
            attribution: '&copy; <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a target="_blank" rel="noopener" href="https://maps.wikimedia.org/">Wikimedia maps</a>'
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
            minZoomIndicatorEnabled: false,
            minZoom: 13
        });
        overpassLayer.addTo(map);

        //Layers control
        layers.createLayers(map);
        layers.getCurFilter().forEach(layers.setFilter);

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
