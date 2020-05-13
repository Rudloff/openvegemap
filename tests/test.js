/*jslint node, es6*/
/*global window*/
if (typeof window !== 'object') {
    throw new Error('qunit must be used in a browser.');
}

require('qunit/qunit/qunit.css');

const qunit = require('qunit');
const layers = require('../js/layers.js');
const openingHours = require('../js/opening_hours.js');
const Popup = require('../js/popup.js');
const POI = require('../js/poi.js');

qunit.start();

qunit.test('layers', function (assert) {
    'use strict';
    assert.ok(Array.isArray(layers.getCurFilter()), 'getCurFilter');
    assert.equal(undefined, layers.createLayers(), 'createLayers');
    assert.equal(undefined, layers.applyFilters(), 'applyFilters');
});

qunit.test('openingHours', function (assert) {
    'use strict';
    assert.equal('<tr><th>Monday</th><td>08:30</td><td>20:00</td></tr><tr><th>Tuesday</th><td>08:30</td><td>20:00</td></tr><tr><th>Wednesday</th><td>08:30</td><td>20:00</td></tr><tr><th>Thursday</th><td>08:30</td><td>20:00</td></tr><tr><th>Friday</th><td>08:30</td><td>20:00</td></tr><tr><th>Sunday</th><td colspan="2">Closed<td></tr>', openingHours.getOpeningHoursTable('Mo-Fr 08:30-20:00'), 'getOpeningHoursTable');
});

qunit.test('POI vegan cafe', function (assert) {
    'use strict';
    const poi = new POI({'diet:vegan': 'yes', amenity: 'cafe'});

    assert.equal('green', poi.getColor(), 'getColor');
    assert.equal('circle', poi.getMarkerIcon(), 'getMarkerIcon');
    assert.equal('vegan', poi.getLayer(), 'getLayer');
    assert.equal('🍵', poi.getIcon(), 'getIcon');
    assert.notOk(poi.isShop(), 'isShop');
});

qunit.test('POI foo shop', function (assert) {
    'use strict';
    const poi = new POI({'diet:vegan': 'foo', shop: 'bar'});

    assert.equal('gray', poi.getColor(), 'getColor');
    assert.equal('question', poi.getMarkerIcon(), 'getMarkerIcon');
    assert.equal('other', poi.getLayer(), 'getLayer');
    assert.equal('🛒', poi.getIcon(), 'getIcon');
    assert.ok(poi.isShop(), 'isShop');
});

qunit.test('Popup', function (assert) {
    'use strict';
    const popup = new Popup({'diet:vegan': 'foo'});

    assert.equal('<ons-list-item modifier="nodivider"><div class="left list-item__title">Vegan</div> <div class="right list-item__subtitle">foo</div></ons-list-item>', popup.getPopupRows(), 'getPopupRows');
});
