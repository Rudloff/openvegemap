<?php

use OpenVegeMap\OsmApi;
use GeoJson\Feature\Feature;
use GeoJson\Geometry\Point;

require_once __DIR__.'/../vendor/autoload.php';

$api = new OsmApi();

header('Content-Type: application/json');
echo json_encode($api->getPoiWithTags(['diet:vegan']));
