/*jslint browser: true, this: true*/
/*global L, InfoControl, ons, window*/
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
        zoomWarningDisplayed = false;

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
        var oh = new opening_hours(value, null);
        return '<ons-list-item id="hoursBtn" tappable modifier="chevron"><div class="left">Opening hours<br/>(' + oh.getStateString(new Date(), true) + ')</div></ons-list-item>';
    }

    function getOpeningHoursTable(value) {
        var oh = new opening_hours(value, null),
            it = oh.getIterator(),
            origDate = new Date(),
            table = '',
            prevDate,
            curDate,
            open,
            prevDay,
            curDay,
            curMonth,
            week = 24 * 60 * 60 * 1000 * 7;
        origDate.setHours(0);
        origDate.setMinutes(0);
        it.setDate(origDate);
        prevDate = origDate;
        curDate = origDate;
        open = it.getState();

        while (it.advance() && curDate - origDate < week) {
            curDate = it.getDate();
            curDay = curDate.getDay();

            if (open) {
                table += '<tr><th>';
                if (prevDay !== curDay) {
                    curMonth = curDate.getMonth() + 1;
                    table += curDate.getDate().toString().padStart(2, 0) + '/' + curMonth.toString().padStart(2, 0);
                    prevDay = curDay;
                }
                table += '</th><td>' + prevDate.getHours().toString().padStart(2, 0) + ':' + prevDate.getMinutes().toString().padStart(2, 0) + '<td>' + curDate.getHours().toString().padStart(2, 0) + ':' + curDate.getMinutes().toString().padStart(2, 0) + '</td></tr></td>';
            }

            open = it.getState();
            prevDate = curDate;
        }
        return table;
    }

    function openDialog() {
        dialogs[this.dialog].show(this.target);
        if (dialogFunctions[this.dialog] && typeof dialogFunctions[this.dialog].show === 'function') {
            dialogFunctions[this.dialog].show();
        }
    }

    function showPopup(e) {
        var popup = '',
            url = L.DomUtil.create('a');
        popup += getPropertyRow('Vegan', e.target.feature.tags['diet:vegan']);
        popup += getPropertyRow('Vegetarian', e.target.feature.tags['diet:vegetarian']);
        if (e.target.feature.tags.cuisine) {
            popup += getPropertyRow('Cuisine', e.target.feature.tags.cuisine.replace(/;/g, ', '));
        }
        popup += getPropertyRow('Take away', e.target.feature.tags.takeaway);
        if (e.target.feature.tags.phone) {
            popup += getPropertyRow('Phone number', '<a href="tel:' + e.target.feature.tags.phone + '">' + e.target.feature.tags.phone.replace(/\s/g, '&nbsp;') + '</a>');
        }
        if (e.target.feature.tags.website) {
            url.href = e.target.feature.tags.website;
            if (url.hostname === 'localhost') {
                e.target.feature.tags.website = 'http://' + e.target.feature.tags.website;
            }
            popup += getPropertyRow('Website', '<a target="_blank" href="' + e.target.feature.tags.website + '">' + e.target.feature.tags.website + '</a>');
        }
        if (e.target.feature.tags.opening_hours) {
            popup += getOpeningHoursBtn(e.target.feature.tags.opening_hours);
            L.DomUtil.get('hoursTable').innerHTML = getOpeningHoursTable(e.target.feature.tags.opening_hours);
        }
        if (!e.target.feature.tags.name) {
            e.target.feature.tags.name = '';
        }
        L.DomUtil.get('mapPopupTitle').innerHTML = e.target.feature.tags.name;
        L.DomUtil.get('mapPopupList').innerHTML = popup;
        L.DomUtil.get('gmapsLink').setAttribute('href', 'https://www.google.fr/maps/dir//' + e.target.feature.lat + ',' + e.target.feature.lon);
        L.DomUtil.get('editLink').setAttribute('href', 'https://editor.openvegemap.netlib.re/' + e.target.feature.type + '/' + e.target.feature.id);
        if (e.target.feature.tags.opening_hours) {
            var hoursBtn = L.DomUtil.get('hoursBtn');
            L.DomEvent.on(hoursBtn, 'click', openDialog, {dialog: 'hoursPopup', target: hoursBtn});
        }
        L.DomUtil.get('mapPopup').show();
    }

    function getIcon(tags) {
        if (tags.shop) {
            switch (tags.shop) {
            case 'bakery':
                return '🥖';
            default:
                return '🛒';
            }
        }
        if (tags.craft) {
            switch (tags.craft) {
            case 'caterer':
                return '🍴';
            default:
                break;
            }
        }
        if (tags.amenity) {
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
    }

    function getLayer(tags) {
        if (isOnlyDiet('vegan', tags)) {
            return layers['vegan-only'];
        }
        if (isOnlyDiet('vegetarian', tags)) {
            return layers['vegetarian-only'];
        }
        if (isDiet('vegan', tags)) {
            return layers.vegan;
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

    function setFilter(filter) {
        layerNames.forEach(removeLayer);
        layerNames.some(function (layer) {
            if (!filter.endsWith('-only') || layer.endsWith('-only')) {
                layers[layer].addTo(map);
            }
            return layer === filter;
        });
        window.localStorage.setItem('filter', filter);
    }

    function applyFilter(radio) {
        if (radio.checked) {
            var filter = radio.getAttribute('input-id');
            if (filter) {
                setFilter(filter);
            }
        }
    }

    function applyFilters() {
        var radios = document.getElementsByName('filter');
        radios.forEach(applyFilter);
        dialogs.filtersDialog.hide();
        menu.close();
    }

    function getCurFilter() {
        var curFilter = window.localStorage.getItem('filter');
        if (!curFilter) {
            curFilter = 'vegetarian';
        }
        return curFilter;
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

    function filtersDialogShow() {
        L.DomUtil.get(getCurFilter()).checked = true;
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
        L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openDialog, {dialog: 'geocodeDialog'});
        L.DomEvent.on(L.DomUtil.get('filtersMenuItem'), 'click', openDialog, {dialog: 'filtersDialog'});
        L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);
        L.DomEvent.on(L.DomUtil.get('aboutMenuItem'), 'click', openDialog, {dialog: 'aboutDialog'});

        //Tiles
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
            detectRetina: true,
            maxNativeZoom: 18,
            maxZoom: 20,
            attribution: '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a target="_blank" href="https://maps.wikimedia.org/">Wikimedia maps</a>'
        }).addTo(map);

        //Permalink
        if (L.UrlUtil.queryParse(hash).lat) {
            //Don't use localStorage value if we have a hash in the URL
            window.localStorage.setItem('paramsTemp', hash);
        }
        map.addControl(new L.Control.Permalink({useLocation: true, useLocalStorage: true}));

        //Legend
        map.addControl(
            new InfoControl(
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
        setFilter(getCurFilter());

        //Dialog functions
        dialogFunctions = {
            geocodeDialog: {
                init: geocodeDialogInit
            },
            filtersDialog: {
                init: filtersDialogInit,
                show: filtersDialogShow
            },
            zoomToast: {
                init: zoomToastInit
            }
        };

        //Dialogs
        ons.createAlertDialog('templates/about.html').then(initDialog);
        ons.createAlertDialog('templates/geocode.html').then(initDialog);
        ons.createAlertDialog('templates/filters.html').then(initDialog);
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
