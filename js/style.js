/*global window*/
if (typeof window !== 'object') {
    throw new Error('OpenVegeMap must be used in a browser.');
}

// Leaflet
require('leaflet/dist/leaflet.css');
require('leaflet-loader/leaflet-loader.css');
require('drmonty-leaflet-awesome-markers/css/leaflet.awesome-markers.css');
require('leaflet-control-geocoder/dist/Control.Geocoder.css');

// Onsen
require('onsenui/css/onsenui-core.css');
require('onsenui/css/onsen-css-components.css');
require('onsenui/css/font_awesome/css/all.css');

// Custom CSS
require('../css/map.css');
