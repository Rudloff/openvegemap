/*jslint browser: true*/
/*global L*/
var openvegemap = (function () {
    'use strict';

    function addMarker(feature, layer) {
        layer.bindPopup(feature.properties.name);
    }

    var geojsonLayer = L.geoJson.ajax(null, { onEachFeature: addMarker }),
        map;

    function updateGeoJson() {
        var bounds = map.getBounds();
        geojsonLayer.refresh('./api/' + bounds.getSouth() + '/' + bounds.getWest() + '/' + bounds.getNorth() + '/' + bounds.getEast());
    }

    return {
        init: function () {
            map = L.map('map').setView([48.5789, 7.7490], 13);

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            geojsonLayer.addTo(map);

            updateGeoJson();

            map.on('moveend', updateGeoJson);

        }
    };
}());

window.addEventListener('load', openvegemap.init, false);
