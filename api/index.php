<?php

use KageNoNeko\OSM\BoundingBox;
use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__.'/../vendor/autoload.php';

$app = new \Slim\App();
$app->get('/{south}/{west}/{north}/{east}', function (Request $request, Response $response) {
    $api = new OsmApi();

    return $response->withJson(
        $api->getPoisWithTag(
            'diet',
            new BoundingBox(
                $request->getAttribute('south'),
                $request->getAttribute('west'),
                $request->getAttribute('north'),
                $request->getAttribute('east')
            )
        )
    );
});
$app->run();
