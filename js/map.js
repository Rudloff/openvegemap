/*jslint browser: true*/
/*global L*/
var openvegemap = (function () {
    'use strict';

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
        switch (feature.properties.amenity) {
        case 'restaurant':
            icon = 'cutlery';
            break;
        case 'cafe':
            icon = 'coffee';
            break;
        }
        layer.setIcon(L.AwesomeMarkers.icon({
            icon: icon,
            prefix: 'fa',
            markerColor: color
        }));
        layer.bindPopup(feature.properties.name);
    }

    var geojsonLayer = L.geoJson.ajax(null, { onEachFeature: addMarker }),
        map,
        curBounds,
        controlLoader;

    function updateGeoJson() {
        var bounds = map.getBounds();
        if (!curBounds || !curBounds.pad(0.2).contains(bounds)) {
            controlLoader.show();
            geojsonLayer.refresh('./api/' + bounds.getSouth() + '/' + bounds.getWest() + '/' + bounds.getNorth() + '/' + bounds.getEast());
            curBounds = bounds;
        }
    }

    function hideLoader() {
        controlLoader.hide();
    }

    return {
        init: function () {
            map = L.map(
                'map',
                {
                    center: [48.5789, 7.7490],
                    zoom: 16,
                    minZoom: 13
                }
            );

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            geojsonLayer.addTo(map);
            geojsonLayer.on('data:loaded', hideLoader);

            map.addControl(
                new L.Control.Geocoder(
                    {
                        collapsed: false,
                        geocoder: new L.Control.Geocoder.Nominatim({ serviceUrl: 'https://nominatim.openstreetmap.org/' }),
                        position: 'topleft'
                    }
                )
            );

            L.control.locate({ position: 'topright' }).addTo(map);

            controlLoader = L.control.loader().addTo(map);

            map.on('moveend', updateGeoJson);
            updateGeoJson();
        }
    };
}());

window.addEventListener('load', openvegemap.init, false);
