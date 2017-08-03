/*jslint browser: true, nomen: true*/
/*global L, InfoControl, ons*/
var openvegemap = (function () {
    'use strict';

    var map,
        controlLoader,
        curFeatures = [],
        menu,
        locate,
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
        if (!e.target.feature.tags.name) {
            e.target.feature.tags.name = '';
        }
        L.DomUtil.get('mapPopupTitle').innerHTML = e.target.feature.tags.name;
        L.DomUtil.get('mapPopupList').innerHTML = popup;
        L.DomUtil.get('gmapsLink').setAttribute('href', 'https://www.google.fr/maps/dir//' + e.target.feature.lat + ',' + e.target.feature.lon);
        L.DomUtil.get('editLink').setAttribute('href', 'https://editor.openvegemap.netlib.re/' + e.target.feature.type + '/' + e.target.feature.id);
        L.DomUtil.get('mapPopup').show();
    }

    function getIcon(tags) {
        switch (tags.shop) {
        case 'bakery':
            return '🥖';
        default:
            break;
        }
        if (tags.shop) {
            return '🛒';
        }
        switch (tags.craft) {
        case 'caterer':
            return '🍴';
        default:
            break;
        }
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
                marker.bindTooltip(getIcon(feature.tags) + '&nbsp;' + feature.tags.name, { direction: 'bottom' });
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
        locate._layer = new L.LayerGroup();
        locate._layer.addTo(map);
        locate._map = map;
        locate._container = L.DomUtil.create('div');
        locate._icon = L.DomUtil.create('div');
        locate.start();
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

    function openDialog() {
        dialogs[this.dialog].show();
        if (dialogFunctions[this.dialog] && typeof dialogFunctions[this.dialog].show === 'function') {
            dialogFunctions[this.dialog].show();
        }
    }

    function initDialog(dialog) {
        dialogs[dialog.id] = dialog;
        if (dialogFunctions[dialog.id] && typeof dialogFunctions[dialog.id].init === 'function') {
            dialogFunctions[dialog.id].init();
        }
    }

    function setFilter(filter) {
        var i;
        for (i = 0; i < layerNames.length; i += 1) {
            layers[layerNames[i]].removeFrom(map);
        }
        for (i = 0; i < layerNames.length; i += 1) {
            if (!filter.endsWith('-only') || layerNames[i].endsWith('-only')) {
                layers[layerNames[i]].addTo(map);
            }
            if (layerNames[i] === filter) {
                break;
            }
        }
        window.localStorage.setItem('filter', filter);
    }

    function applyFilter() {
        var radios = document.getElementsByName('filter'),
            i;
        for (i = 0; i < radios.length; i += 1) {
            if (radios[i].checked) {
                setFilter(radios[i].getAttribute('input-id'));
                break;
            }
        }
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

    function createLayers() {
        var i;
        for (i = 0; i < layerNames.length; i += 1) {
            layers[layerNames[i]] = L.layerGroup();
        }
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
                geocoder: new L.Control.Geocoder.Nominatim({ serviceUrl: 'https://nominatim.openstreetmap.org/' }),
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
        L.DomEvent.on(L.DomUtil.get('filtersDialogBtn'), 'click', applyFilter);
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
        L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openDialog, { dialog: 'geocodeDialog' });
        L.DomEvent.on(L.DomUtil.get('filtersMenuItem'), 'click', openDialog, { dialog: 'filtersDialog' });
        L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);
        L.DomEvent.on(L.DomUtil.get('aboutMenuItem'), 'click', openDialog, { dialog: 'aboutDialog' });

        //Tiles
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
            detectRetina: true,
            maxNativeZoom: 18,
            maxZoom: 20,
            attribution: '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a target="_blank" href="https://maps.wikimedia.org/">Wikimedia maps</a>'
        }).addTo(map);

        //Geolocation
        locate = L.control.locate({ position: 'topright' });

        //Permalink
        if (L.UrlUtil.queryParse(hash).lat) {
            //Don't use localStorage value if we have a hash in the URL
            window.localStorage.setItem('paramsTemp', hash);
        }
        map.addControl(new L.Control.Permalink({ useLocation: true, useLocalStorage: true }));

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
        new L.OverPassLayer({
            endPoint: 'https://overpass-api.de/api/',
            query: 'node({{bbox}})[~"^diet:.*$"~"."];out;way({{bbox}})[~"^diet:.*$"~"."];out center;',
            beforeRequest: showLoader,
            afterRequest: hideLoader,
            onSuccess: addMarkers,
            minZoomIndicatorEnabled: false
        }).addTo(map);

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
            zoomToast : {
                init: zoomToastInit
            }
        };

        //Dialogs
        ons.createAlertDialog('templates/about.html').then(initDialog);
        ons.createAlertDialog('templates/geocode.html').then(initDialog);
        ons.createAlertDialog('templates/filters.html').then(initDialog);
        ons.createAlertDialog('templates/popup.html').then(initDialog);
        ons.createAlertDialog('templates/zoom.html').then(initDialog);

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
