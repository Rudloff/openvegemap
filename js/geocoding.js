let geocoder;

/**
 * Start the geocoder.
 * @return {void}
 */
function geocode() {
    geocoder._geocode();
}

/**
 * Initialize the geocoder.
 * @param  {Function} callback  Callback called when a result is clicked.
 * @param  {Element}  container HTML Element containing the results.
 * @return {void}
 */
function init(callback, container) {
    geocoder = new L.Control.Geocoder(
        {
            geocoder: new L.Control.Geocoder.Nominatim({serviceUrl: 'https://nominatim.openstreetmap.org/'}),
            position: 'topleft',
            defaultMarkGeocode: false
        }
    );
    geocoder.on('markgeocode', callback);
    geocoder._alts = L.DomUtil.get('geocodeAlt');
    geocoder._container = container;
    geocoder._errorElement = L.DomUtil.get('geocodeError');
    geocoder._input = L.DomUtil.get('geocodeInput');
    L.DomEvent.on(L.DomUtil.get('geocodeDialogBtn'), 'click', geocode);
}

export default {
    init
};
