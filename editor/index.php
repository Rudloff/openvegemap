<?php

use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__.'/../vendor/autoload.php';

$app = new \Slim\App();
$app->get('/{id}', function (Request $request, Response $response) {
    $api = new OsmApi();
    dump($api->getById($request->getAttribute('id')));
});
$app->run();
