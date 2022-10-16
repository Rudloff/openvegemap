if (typeof window !== 'object') {
    throw new Error('OpenVegeMap must be used in a browser.');
}

// Check old browsers
import oldbrowsers from './oldbrowser.js';
oldbrowsers.init();

// JS
import ons from 'onsenui';
import L from 'leaflet';
import {SimpleOpeningHours} from 'simple-opening-hours';
import 'leaflet-loader/leaflet-loader.js';
import 'leaflet-plugins/control/Permalink.js';
import 'leaflet-overpass-layer';
import 'leaflet-control-geocoder';
import 'drmonty-leaflet-awesome-markers';
import 'leaflet-info-control';

import openingHours from './openingHours.js';
import layers from './layers.js';
import geocoding from './geocoding.js';
import POI from './poi.js';
import Popup from './popup.js';


let map;
let controlLoader;
let circle;
let curFeatures = [];
let menu;
const dialogs = {};
let dialogFunctions = {};
let zoomWarningDisplayed = false;
const routingProviders = {
    google: 'https://www.google.com/maps/dir//{LAT},{LON}',
    graphhopper: 'https://graphhopper.com/maps/?point=&point={LAT},{LON}',
    openroute: 'https://openrouteservice.org/directions?a=null,null,{LAT},{LON}'
};
let overpassLayer;
const overpassQuery = 'nwr({{bbox}})[!"disused:shop"][!"disused:amenity"][~"^diet:.*$"~"."];out center;';

/**
 * Open a dialog.
 * @param  {MouseEvent} e Event that triggered the dialog
 * @return {void}
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
    let url = localStorage.getItem('routing-provider');
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
 * Add a link to https://lib.reviews/.
 * @param {Event} e Event
 */
function addReviewLink(e) {
    if (e.target.readyState === XMLHttpRequest.DONE) {
        if (e.target.status === 200) {
            const data = JSON.parse(e.target.response);
            const reviewLink = L.DomUtil.get('reviewLink');
            reviewLink.setAttribute('href', 'https://lib.reviews/' + data.thing.urlID);
            reviewLink.removeAttribute('disabled');
        }
    }
}

/**
 * Start an AJAX request to get reviews from https://lib.reviews/.
 * @param  {Object} feature POI
 * @return {void}
 */
function loadReviews(feature) {
    const reviewLink = L.DomUtil.get('reviewLink');
    reviewLink.removeAttribute('href');
    reviewLink.setAttribute('disabled', 'disabled');

    const request = new XMLHttpRequest();
    request.open('GET', 'https://lib.reviews/api/thing?url=https://www.openstreetmap.org/' + feature.type + '/' + feature.id, true);
    request.onreadystatechange = addReviewLink;
    request.send();
}

/**
 * Display a marker popup.
 * @param  {Object} e Leaflet DomEvent
 * @return {void}
 */
function showPopup(e) {
    const poi = new POI(e.target.feature.tags);
    const popup = new Popup(e.target.feature.tags);
    const html = popup.getPopupRows();
    if (e.target.feature.tags.opening_hours) {
        try {
            L.DomUtil.get('hoursTable').innerHTML = openingHours.getOpeningHoursTable(e.target.feature.tags.opening_hours);
        } catch (error) {
            console.error(
                'Malformed opening hours data for ' + e.target.feature.type + ' ' + e.target.feature.id + ': ' + error
            );
        }
    }
    if (!e.target.feature.tags.name) {
        e.target.feature.tags.name = '';
    }
    L.DomUtil.get('mapPopupTitle').innerHTML = poi.getIcon() + '&nbsp;' + e.target.feature.tags.name;
    L.DomUtil.get('mapPopupList').innerHTML = html;
    L.DomUtil.get('gmapsLink').setAttribute('href', getRoutingUrl(e.target.feature.lat, e.target.feature.lon));
    L.DomUtil.get('editLink').setAttribute('href', 'https://editor.openvegemap.netlib.re/' + e.target.feature.type + '/' + e.target.feature.id);
    if (e.target.feature.tags.opening_hours) {
        const hoursBtn = L.DomUtil.get('hoursBtn');
        if (hoursBtn) {
            L.DomEvent.on(hoursBtn, 'click', openDialog);
        }
    }

    loadReviews(e.target.feature);

    L.DomUtil.get('mapPopup').show();
}

/**
 * Add a marker to the map.
 * @param {Object} feature POI
 */
function addMarker(feature) {
    // Does the user want to hide closed restaurants?
    if (JSON.parse(localStorage.getItem('hide-closed')) && feature.tags.opening_hours) {
        try {
            const opening = new SimpleOpeningHours(feature.tags.opening_hours);

            if (!opening.isOpenNow()) {
                // Don't add markers for closed restaurants.
                return;
            }
        } catch (error) {
            console.error(
                'Malformed opening hours data for ' + feature.type + ' ' + feature.id + ': ' + error
            );
        }
    }

    if (curFeatures.indexOf(feature.id) === -1) {
        curFeatures.push(feature.id);
        if (feature.center) {
            feature.lat = feature.center.lat;
            feature.lon = feature.center.lon;
        }
        const poi = new POI(feature.tags);
        const marker = L.marker([feature.lat, feature.lon]);
        marker.feature = feature;
        marker.setIcon(L.AwesomeMarkers.icon({
            icon: poi.getMarkerIcon(),
            prefix: 'fa',
            markerColor: poi.getColor()
        }));
        marker.on('click', showPopup);

        let tooltip = poi.getIcon();
        if (feature.tags.name) {
            tooltip += '&nbsp;' + feature.tags.name;
        }
        marker.bindTooltip(tooltip, {direction: 'bottom'});

        layers.addMarker(marker, poi.getLayer(), poi.isShop());
    }
}

/**
 * Hide the loader.
 * @return {void}
 */
function hideLoader() {
    controlLoader.hide();
}

/**
 * Show the loader.
 * @return {void}
 */
function showLoader() {
    controlLoader.show();
}

/**
 * Move the map to the location of the user.
 * @return {void}
 */
function locateMe() {
    map.locate({setView: true, enableHighAccuracy: true});
    menu.close();
}

/**
 * Initilize menu buttons
 * @return {void}
 */
function initMenu() {
    // We should probably initialize this when the template is loaded instead.
    L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openDialog);
    L.DomEvent.on(L.DomUtil.get('filtersMenuItem'), 'click', openDialog);
    L.DomEvent.on(L.DomUtil.get('preferencesMenuItem'), 'click', openDialog);
    L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);
    L.DomEvent.on(L.DomUtil.get('aboutMenuItem'), 'click', openDialog);
}

/**
 * Open the main menu.
 * @return {void}
 */
function openMenu() {
    menu.toggle();
}

/**
 * Display a circle on the map
 * @param  {Object} latLng Leaflet LatLng
 * @param  {int}    radius Circle radius
 * @return {void}
 */
function showCircle(latLng, radius) {
    if (circle === undefined) {
        circle = new L.Circle(latLng, {radius: radius});
        circle.addTo(map);
    } else {
        circle.setLatLng(latLng);
        circle.setRadius(radius);
    }
    map.fitBounds(circle.getBounds());
}

/**
 * Add a circle on the map at the coordinates returned by the geocoder.
 * @param {Object} e Object returned by the markgeocode event
 */
function addGeocodeMarker(e) {
    showCircle(e.geocode.center, 10);
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
 * @return {void}
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
 * @return {void}
 */
function checkZoomLevel(e) {
    const zoom = e.target.getZoom();
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
 * @return {void}
 */
function geocodeDialogInit() {
    geocoding.init(addGeocodeMarker, dialogs.geocodeDialog);
}

/**
 * Function called when the apply button in the filters dialog is clicked
 * @return {void}
 */
function applyFilters() {
    layers.applyFilters();
    dialogs.filtersDialog.hide();
    menu.close();
}

/**
 * Initialize the filters dialog.
 * @return {void}
 */
function filtersDialogInit() {
    L.DomEvent.on(L.DomUtil.get('filtersDialogBtn'), 'click', applyFilters);
}

/**
 * Check the checkbox for the specified filter in the filters dialog.
 * @param  {string} layer Layer name
 * @return {void}
 */
function filtersDialogCheckbox(layer) {
    L.DomUtil.get(layer + '-filter').checked = true;
}

/**
 * Function called when displaying the filters dialog.
 * @return {void}
 */
function filtersDialogShow() {
    layers.getCurFilter().forEach(filtersDialogCheckbox);
}

/**
 * Set the routing provider from the preferences.
 * @return {void}
 */
function setRoutingProvider() {
    let curProvider = routingProviders.google;
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
}

/**
 * Remove every marker from the map and reload them.
 * @return {void}
 */
function clearMap() {
    curFeatures = [];
    layers.clearLayers();
    overpassLayer.setQuery(overpassQuery);
}

/**
 * Save the preferences.
 * @return {void}
 */
function savePreferences() {
    setRoutingProvider();

    localStorage.setItem('hide-closed', L.DomUtil.get('hide-closed').checked);

    dialogs.preferencesDialog.hide();
    menu.close();

    // Reload markers to apply changes.
    clearMap();
}

/**
 * Initialize the preferences dialog.
 * @return {void}
 */
function preferencesDialogInit() {
    L.DomEvent.on(L.DomUtil.get('preferencesDialogBtn'), 'click', savePreferences);
}

/**
 * Function called when displaying the preferences dialog.
 * @return {void}
 */
function preferencesDialogShow() {
    const url = localStorage.getItem('routing-provider');
    let curProvider;
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

    L.DomUtil.get('hide-closed').checked = JSON.parse(localStorage.getItem('hide-closed'));
}

/**
 * Initialize the zoom level warning toast.
 * @return {void}
 */
function zoomToastInit() {
    checkZoomLevel({target: map});
}

/**
 * Called when the app is opened from a deep link.
 * @param  {Object} e Event data
 * @return {void}
 */
function handleDeepLink(e) {
    const params = L.UrlUtil.queryParse(e.hash);
    map.setView(params, params.zoom);
}

/**
 * Called when a page template is loaded
 * @param  {Object} e Event
 * @return {void}
 */
function pageInit(e) {
    if (e.target.id === 'menuPage') {
        initMenu();
    }
}

/**
 * Called when a new location is found
 * @param  {Object} e Leaflet LocationEvent
 * @return {void}
 */
function newLocation(e) {
    showCircle(e.latlng, e.accuracy);
}

/**
 * Initialize the app.
 * @return {void}
 */
function init() {
    // Variables
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
    const hash = L.UrlUtil.hash();

    // Generic event called when a page template is loaded
    L.DomEvent.on(document, 'init', pageInit);

    // Menu
    L.DomEvent.on(L.DomUtil.get('menuBtn'), 'click', openMenu);

    // Tiles
    L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
        maxNativeZoom: 18,
        maxZoom: 20,
        attribution: '&copy; <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a target="_blank" rel="noopener" href="https://maps.wikimedia.org/">Wikimedia maps</a>'
    }).addTo(map);

    // Permalink
    if (L.UrlUtil.queryParse(hash).lat) {
        // Don't use localStorage value if we have a hash in the URL
        localStorage.setItem('paramsTemp', hash);
    }
    map.addControl(new L.Control.Permalink({useLocation: true, useLocalStorage: true}));

    // Legend
    map.addControl(
        new L.Control.InfoControl(
            {
                position: 'bottomright',
                content: '<div title="Restaurants that serve only vegan food"><i class="fa fa-bullseye" style="background-color: #72AF26"></i> Vegan only</div>' +
                    '<div title="Restaurants that serve vegan food and other food"><i class="fa fa-circle" style="background-color: #72AF26"></i> Vegan friendly</div>' +
                    '<div title="Restaurants that serve only vegetarian food but no vegan food"><i class="fa fa-circle-notch" style="background-color: #728224"></i> Vegetarian only</div>' +
                    '<div title="Restaurants that serve vegetarian food and meat but no vegan food"><i class="fa fa-dot-circle" style="background-color: #728224"></i> Vegetarian friendly</div>' +
                    '<div title="Restaurants that serve meat"><i class="fa fa-ban" style="background-color: #D63E2A"></i> Not vegetarian</div>' +
                    '<div title="Restaurants we don\'t have enough information about"><i class="fa fa-question" style="background-color: #575757"></i> Unknown</div>'
            }
        )
    );

    // Overpass
    overpassLayer = new L.OverPassLayer({
        endPoint: 'https://overpass-api.de/api/',
        query: overpassQuery,
        beforeRequest: showLoader,
        afterRequest: hideLoader,
        onSuccess: addMarkers,
        minZoomIndicatorEnabled: false,
        minZoom: 13,
        cacheEnabled: true
    });
    overpassLayer.addTo(map);

    // Layers control
    layers.createLayers(map);
    layers.refreshFilters();

    // Dialog functions
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
        zoomToast: {
            init: zoomToastInit
        }
    };

    // Dialogs
    ons.createAlertDialog('templates/about.html').then(initDialog);
    ons.createAlertDialog('templates/geocode.html').then(initDialog);
    ons.createAlertDialog('templates/filters.html').then(initDialog);
    ons.createAlertDialog('templates/preferences.html').then(initDialog);
    ons.createAlertDialog('templates/popup.html').then(initDialog);
    ons.createAlertDialog('templates/zoom.html').then(initDialog);
    ons.createAlertDialog('templates/hours.html').then(initDialog);

    // Map events
    map.on('zoom', checkZoomLevel);
    map.on('locationfound', newLocation);

    // Handle deep links
    if (typeof universalLinks === 'object') {
        universalLinks.subscribe(null, handleDeepLink);
    }
}

if (typeof ons === 'object') {
    ons.ready(init);
} else {
    throw new Error('Onsen is not loaded');
}
