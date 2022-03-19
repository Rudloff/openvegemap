import L from 'leaflet';

export default class geocoding {

    /**
     * Start the geocoder.
     * @return {void}
     */
    static geocode() {
        geocoding.geocoder._geocode();
    }

    /**
     * Initialize the geocoder.
     * @param  {Function} callback  Callback called when a result is clicked.
     * @param  {Element}  container HTML Element containing the results.
     * @return {void}
     */
    static init(callback, container) {
        this.geocoder = new L.Control.Geocoder(
            {
                geocoder: new L.Control.Geocoder.Nominatim({serviceUrl: 'https://nominatim.openstreetmap.org/'}),
                position: 'topleft',
                defaultMarkGeocode: false
            }
        );
        this.geocoder.on('markgeocode', callback);
        this.geocoder._alts = L.DomUtil.get('geocodeAlt');
        this.geocoder._container = container;
        this.geocoder._errorElement = L.DomUtil.get('geocodeError');
        this.geocoder._input = L.DomUtil.get('geocodeInput');
        L.DomEvent.on(L.DomUtil.get('geocodeDialogBtn'), 'click', this.geocode);
    }
}
