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
    InfoControl, shim, currentTarget, dataset
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

require('./oldbrowser.js');

var openvegemap = (function () {
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

    function isDiet(diet, tags) {
        var key = 'diet:' + diet;
        if (tags[key] && (tags[key] === 'yes' || tags[key] === 'only')) {
            return true;
        }
        return false;
    }

    function isNotDiet(diet, tags) {
        var key = 'diet:' + diet;
        if (tags[key] && tags[key] === 'no') {
            return true;
        }
        return false;
    }

    function isOnlyDiet(diet, tags) {
        var key = 'diet:' + diet;
        if (tags[key] && tags[key] === 'only') {
            return true;
        }
        return false;
    }

    function getPropertyRow(name, value) {
        if (value) {
            return '<ons-list-item modifier="nodivider"><div class="left">' + name + '</div> <div class="right">' + value.replace(/_/g, ' ') + '</div></ons-list-item>';
        }
        return '';
    }

    function getOpeningHoursBtn(value) {
        var oh = new OH(value, null);
        return '<ons-list-item id="hoursBtn" data-dialog="hoursPopup" tappable modifier="chevron"><div class="left">Opening hours<br/>(' + oh.getStateString(new Date(), true) + ')</div></ons-list-item>';
    }

    function formatHour(date) {
        return date.getHours().toString().padStart(2, 0) + ':' + date.getMinutes().toString().padStart(2, 0);
    }

    function formatDay(date) {
        return date.toLocaleDateString('en-US', {weekday: 'long'});
    }

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

    function openDialog(e) {
        dialogs[e.currentTarget.dataset.dialog].show(e.currentTarget);
        if (dialogFunctions[e.currentTarget.dataset.dialog] && typeof dialogFunctions[e.currentTarget.dataset.dialog].show === 'function') {
            dialogFunctions[e.currentTarget.dataset.dialog].show();
        }
    }

    function getPopupRows(tags) {
        var rows = '',
            url = L.DomUtil.create('a');
        rows += getPropertyRow('Vegan', tags['diet:vegan']);
        rows += getPropertyRow('Vegetarian', tags['diet:vegetarian']);
        if (tags.cuisine) {
            rows += getPropertyRow('Cuisine', tags.cuisine.replace(/;/g, ', '));
        }
        rows += getPropertyRow('Take away', tags.takeaway);
        if (tags.phone) {
            rows += getPropertyRow('Phone number', '<a href="tel:' + tags.phone + '">' + tags.phone.replace(/\s/g, '&nbsp;') + '</a>');
        }
        if (tags.website) {
            url.href = tags.website;
            if (url.hostname === 'localhost') {
                tags.website = 'http://' + tags.website;
            }
            rows += getPropertyRow('Website', '<a target="_blank" href="' + tags.website + '">' + tags.website + '</a>');
        }
        if (tags.opening_hours) {
            rows += getOpeningHoursBtn(tags.opening_hours);
        }
        return rows;
    }

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

    function showPopup(e) {
        var popup = '';
        popup += getPopupRows(e.target.feature.tags);
        if (e.target.feature.tags.opening_hours) {
            L.DomUtil.get('hoursTable').innerHTML = getOpeningHoursTable(e.target.feature.tags.opening_hours);
        }
        if (!e.target.feature.tags.name) {
            e.target.feature.tags.name = '';
        }
        L.DomUtil.get('mapPopupTitle').innerHTML = e.target.feature.tags.name;
        L.DomUtil.get('mapPopupList').innerHTML = popup;
        L.DomUtil.get('gmapsLink').setAttribute('href', getRoutingUrl(e.target.feature.lat, e.target.feature.lon));
        L.DomUtil.get('editLink').setAttribute('href', 'https://editor.openvegemap.netlib.re/' + e.target.feature.type + '/' + e.target.feature.id);
        if (e.target.feature.tags.opening_hours) {
            var hoursBtn = L.DomUtil.get('hoursBtn');
            L.DomEvent.on(hoursBtn, 'click', openDialog);
        }
        L.DomUtil.get('mapPopup').show();
    }

    function getShopIcon(tags) {
        switch (tags.shop) {
        case 'bakery':
            return '🥖';
        default:
            return '🛒';
        }
    }

    function getCraftIcon(tags) {
        switch (tags.craft) {
        case 'caterer':
            return '🍴';
        default:
            return '';
        }
    }

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

    function getLayer(tags) {
        if (isOnlyDiet('vegan', tags)) {
            return layers['vegan-only'];
        }
        if (isDiet('vegan', tags)) {
            return layers.vegan;
        }
        if (isOnlyDiet('vegetarian', tags)) {
            return layers['vegetarian-only'];
        }
        if (isDiet('vegetarian', tags)) {
            return layers.vegetarian;
        }
        return layers.other;
    }

    function getMarkerIcon(tags) {
        if (isOnlyDiet('vegan', tags)) {
            return 'dot-circle-o';
        }
        if (isDiet('vegan', tags)) {
            return 'circle';
        }
        if (isDiet('vegetarian', tags)) {
            return 'circle-o';
        }
        if (isNotDiet('vegetarian', tags)) {
            return 'ban';
        }
        return 'question';
    }

    function getColor(tags) {
        if (isDiet('vegan', tags)) {
            return 'green';
        }
        if (isDiet('vegetarian', tags)) {
            return 'darkgreen';
        }
        if (isNotDiet('vegetarian', tags)) {
            return 'red';
        }
        return 'gray';
    }

    function addMarker(feature) {
        if (curFeatures.indexOf(feature.id) === -1) {
            curFeatures.push(feature.id);
            if (feature.center) {
                feature.lat = feature.center.lat;
                feature.lon = feature.center.lon;
            }
            var marker = L.marker([feature.lat, feature.lon]);
            marker.feature = feature;
            marker.setIcon(L.AwesomeMarkers.icon({
                icon: getMarkerIcon(feature.tags),
                prefix: 'fa',
                markerColor: getColor(feature.tags)
            }));
            marker.on('click', showPopup);
            if (feature.tags.name) {
                marker.bindTooltip(getIcon(feature.tags) + '&nbsp;' + feature.tags.name, {direction: 'bottom'});
            }
            marker.addTo(getLayer(feature.tags));
        }
    }

    function hideLoader() {
        controlLoader.hide();
    }

    function showLoader() {
        controlLoader.show();
    }

    function openMenu() {
        menu.open();
    }

    function locateMe() {
        map.locate({setView: true, enableHighAccuracy: true});
        menu.close();
    }

    function geocode() {
        geocoder._geocode();
    }

    function addGeocodeMarker(e) {
        var circle = L.circle(e.geocode.center, 10);
        circle.addTo(map);
        map.fitBounds(circle.getBounds());
        dialogs.geocodeDialog.hide();
        menu.close();
    }

    function addMarkers(data) {
        data.elements.forEach(addMarker);
    }

    function initDialog(dialog) {
        dialogs[dialog.id] = dialog;
        if (dialogFunctions[dialog.id] && typeof dialogFunctions[dialog.id].init === 'function') {
            dialogFunctions[dialog.id].init();
        }
    }

    function removeLayer(layer) {
        layers[layer].removeFrom(map);
    }

    function setFilter(layer) {
        layers[layer].addTo(map);
    }

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

    function getCurFilter() {
        var curFilters = JSON.parse(localStorage.getItem('filters'));
        if (!curFilters) {
            curFilters = ['vegan', 'vegan-only', 'vegetarian', 'vegetarian-only'];
        }
        return curFilters;
    }

    function createLayer(layer) {
        layers[layer] = L.layerGroup();
    }

    function createLayers() {
        layerNames.forEach(createLayer);
    }

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

    function filtersDialogInit() {
        L.DomEvent.on(L.DomUtil.get('filtersDialogBtn'), 'click', applyFilters);
    }

    function filtersDialogCheckbox(layer) {
        L.DomUtil.get(layer + '-filter').checked = true;
    }

    function filtersDialogShow() {
        getCurFilter().forEach(filtersDialogCheckbox);
    }

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

    function preferencesDialogInit() {
        L.DomEvent.on(L.DomUtil.get('preferencesDialogBtn'), 'click', setRoutingProvider);
    }

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

    function zoomToastInit() {
        checkZoomLevel({target: map});
    }

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
}());

if (typeof ons === 'object') {
    ons.ready(openvegemap.init);
} else {
    throw 'Onsen is not loaded';
}
