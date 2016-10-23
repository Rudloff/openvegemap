<?php

use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__.'/../vendor/autoload.php';

$app = new \Slim\App();
$container = $app->getContainer();
$container['view'] = function ($c) {
    $view = new \Slim\Views\Smarty(__DIR__.'/../templates/', ['compileDir'=>__DIR__.'/../templates_c/']);
    $smartyPlugins = new \Slim\Views\SmartyPlugins($c['router'], $c['request']->getUri());
    $view->registerPlugin('function', 'path_for', [$smartyPlugins, 'pathFor']);
    $view->registerPlugin('function', 'base_url', [$smartyPlugins, 'baseUrl']);
    return $view;
};
$app->get('/{id}', function (Request $request, Response $response) use ($container) {
    $api = new OsmApi();
    $feature = $api->getById($request->getAttribute('id'));
    $container->view->render(
        $response,
        'edit.html',
        [
            'properties'=>$feature->getProperties(),
            'coords'=>$feature->getGeometry()->getCoordinates(),
            'id'=>$feature->getId(),
            'editProperties'=>[
                'diet:vegan'=>'Vegan',
                'diet:vegetarian'=>'Vegetarian'
            ]
        ]
    );
});
$app->run();
