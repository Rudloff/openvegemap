/*jslint browser: true, nomen: true*/
/*global L, ons*/
var openvegemap = (function () {
    'use strict';

    var map,
        curBounds,
        controlLoader,
        curFeatures = [],
        menu,
        geocodeDialog,
        locate,
        geocoder;

    function isDiet(diet, properties) {
        var key = 'diet:' + diet;
        if (properties[key] && (properties[key] === 'yes' || properties[key] === 'only')) {
            return true;
        }
        return false;
    }

    function isNotDiet(diet, properties) {
        var key = 'diet:' + diet;
        if (properties[key] && properties[key] === 'no') {
            return true;
        }
        return false;
    }

    function getPropertyRow(name, value) {
        if (value) {
            return '<ons-list-item><div class="left">' + name + '</div> <div class="right">' + value + '</div></ons-list-item>';
        }
        return '';
    }

    function showPopup(e) {
        var popup = '';
        popup += getPropertyRow('Cuisine', e.target.feature.properties.cuisine);
        popup += getPropertyRow('Take away', e.target.feature.properties.takeaway);
        if (e.target.feature.properties.phone) {
            popup += getPropertyRow('Phone number', '<a href="tel:' + e.target.feature.properties.phone + '">' + e.target.feature.properties.phone.replace(/\s/g, '&nbsp;') + '</a>');
        }
        if (e.target.feature.properties.website) {
            popup += getPropertyRow('Website', '<a target="_blank" href="' + e.target.feature.properties.website + '">' + e.target.feature.properties.website + '</a>');
        }
        if (!e.target.feature.properties.name) {
            e.target.feature.properties.name = '';
        }
        L.DomUtil.get('mapPopupTitle').innerHTML = e.target.feature.properties.name;
        L.DomUtil.get('mapPopupList').innerHTML = popup;
        L.DomUtil.get('gmapsLink').setAttribute('href', 'https://www.google.fr/maps/dir//' + e.target.feature.geometry.coordinates[1] + ',' + e.target.feature.geometry.coordinates[0]);
        L.DomUtil.get('editLink').setAttribute('href', './editor/' + e.target.feature.id);
        L.DomUtil.get('mapPopup').show();
    }

    function addMarker(feature, layer) {
        var color = 'gray',
            icon;
        if (isDiet('vegan', feature.properties)) {
            color = 'green';
        } else if (isDiet('vegetarian', feature.properties)) {
            color = 'darkgreen';
        } else if (isNotDiet('vegetarian', feature.properties)) {
            color = 'red';
        }
        if (feature.properties.shop) {
            icon = 'shopping-cart';
        }
        switch (feature.properties.amenity) {
        case 'fast_food':
        case 'restaurant':
            icon = 'cutlery';
            break;
        case 'cafe':
            icon = 'coffee';
            break;
        case 'bar':
        case 'pub':
            icon = 'beer';
            break;
        }
        layer.setIcon(L.AwesomeMarkers.icon({
            icon: icon,
            prefix: 'fa',
            markerColor: color
        }));
        layer.on('click', showPopup);
        if (feature.properties.name) {
            layer.bindTooltip(feature.properties.name, { direction: 'bottom' });
        }
    }

    function removeDuplicates(data) {
        var newData = [];
        data.features.forEach(function (feature) {
            if (curFeatures.indexOf(feature.id) === -1) {
                curFeatures.push(feature.id);
                newData.push(feature);
            }
        });
        data.features = newData;
        return data;
    }

    function hideLoader() {
        controlLoader.hide();
    }

    function updateGeoJson() {
        var bounds = map.getBounds();
        if (!curBounds || !curBounds.pad(0.2).contains(bounds)) {
            controlLoader.show();
            L.geoJson.ajax(
                './api/' + bounds.getSouth() + '/' + bounds.getWest() + '/' + bounds.getNorth() + '/' + bounds.getEast(),
                {
                    onEachFeature: addMarker,
                    middleware: removeDuplicates
                }
            ).addTo(map).on('data:loaded', hideLoader);
            curBounds = bounds;
        }
    }

    function addLegend() {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = '<i style="background-color: #72AF26"></i> Vegan<br/>'
            + '<i style="background-color: #728224"></i> Vegetarian<br/>'
            + '<i style="background-color: #D63E2A"></i> Meat only<br/>'
            + '<i style="background-color: #575757"></i> Unknown<br/>';
        return div;
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

    function openGeocodeDialog() {
        geocodeDialog.show();
    }

    function addGeocodeMarker(e) {
        var circle = L.circle(e.geocode.center, 10);
        circle.addTo(map);
        map.fitBounds(circle.getBounds());
        geocodeDialog.hide();
        menu.close();
    }

    return {
        init: function () {
            //Variables
            menu = L.DomUtil.get('menu');
            geocodeDialog = L.DomUtil.get('geocodeDialog');
            map = L.map(
                'map',
                {
                    center: [48.5789, 7.7490],
                    zoom: 16,
                    minZoom: 13
                }
            );
            controlLoader = L.control.loader().addTo(map);

            //Events
            L.DomEvent.on(L.DomUtil.get('menuBtn'), 'click', openMenu);
            L.DomEvent.on(L.DomUtil.get('geocodeDialogBtn'), 'click', geocode);
            L.DomEvent.on(L.DomUtil.get('geocodeMenuItem'), 'click', openGeocodeDialog);
            map.on('moveend', updateGeoJson);

            //Tiles
            L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
                detectRetina: true
            }).addTo(map);

            //Geocoder
            geocoder = new L.Control.Geocoder(
                {
                    geocoder: new L.Control.Geocoder.Nominatim({ serviceUrl: 'https://nominatim.openstreetmap.org/' }),
                    position: 'topleft',
                    defaultMarkGeocode: false
                }
            ).on('markgeocode', addGeocodeMarker);
            geocoder._alts = L.DomUtil.get('geocodeAlt');
            geocoder._container = geocodeDialog;
            geocoder._errorElement = L.DomUtil.create('div');
            geocoder._input = L.DomUtil.get('geocodeInput');

            //Geolocation
            locate = L.control.locate({ position: 'topright' });
            L.DomEvent.on(L.DomUtil.get('locateMenuItem'), 'click', locateMe);

            //Permalink
            map.addControl(new L.Control.Permalink({ useLocation: true, text: null}));

            //Legend
            var legend = L.control({position: 'bottomright'});
            legend.onAdd = addLegend;
            legend.addTo(map);

            //Load initial markers
            updateGeoJson();
        }
    };
}());

ons.ready(openvegemap.init);
