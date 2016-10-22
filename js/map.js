/*jslint browser: true*/
/*global L*/
var openvegemap = (function () {
    'use strict';

    var map,
        curBounds,
        controlLoader,
        curFeatures = [];

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
            return '<tr><th>' + name + '</th><td>' + value + '</td></tr>';
        }
        return '';
    }

    function addMarker(feature, layer) {
        var color = 'gray',
            icon,
            popup = '';
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
        if (feature.properties.name) {
            popup += feature.properties.name;
        }
        popup += '<table>';
        popup += getPropertyRow('Take away', feature.properties.takeaway);
        if (feature.properties.phone) {
            popup += getPropertyRow('Phone number', '<a href="tel:' + feature.properties.phone + '">' + feature.properties.phone + '</a>');
        }
        if (feature.properties.website) {
            popup += getPropertyRow('Website', '<a target="_blank" href="' + feature.properties.website + '">' + feature.properties.website + '</a>');
        }
        popup += '</table>';
        popup += '<br/><a target="_blank" href="http://www.openstreetmap.org/node/' + feature.id + '">See on OSM</a>';
        layer.bindPopup(popup);
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

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);



            map.addControl(
                new L.Control.Geocoder(
                    {
                        geocoder: new L.Control.Geocoder.Nominatim({ serviceUrl: 'https://nominatim.openstreetmap.org/' }),
                        position: 'topleft',
                        defaultMarkGeocode: false
                    }
                ).on('markgeocode', function (e) {
                    var circle = L.circle(e.geocode.center, 10);
                    circle.addTo(map);
                    map.fitBounds(circle.getBounds());
                })
            );

            L.control.locate({ position: 'topright' }).addTo(map);

            map.addControl(new L.Control.Permalink({ useLocation: true}));

            controlLoader = L.control.loader().addTo(map);

            var legend = L.control({position: 'bottomright'});
            legend.onAdd = addLegend;
            legend.addTo(map);

            map.on('moveend', updateGeoJson);
            updateGeoJson();
        }
    };
}());

window.addEventListener('load', openvegemap.init, false);
