<?php

use OpenVegeMap\OsmApi;

require_once __DIR__.'/../vendor/autoload.php';

$api = new OsmApi();

header('Content-Type: application/json');
echo json_encode($api->getPoiWithTags(['diet:vegan']));
