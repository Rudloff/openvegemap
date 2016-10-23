<?php

use OpenVegeMap\Controller\EditorController;

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../config.php';

$app = new \Slim\App();
$container = $app->getContainer();
$container['view'] = function ($c) {
    $view = new \Slim\Views\Smarty(__DIR__.'/../templates/', ['compileDir' => __DIR__.'/../templates_c/']);
    $smartyPlugins = new \Slim\Views\SmartyPlugins($c['router'], $c['request']->getUri());
    $view->registerPlugin('function', 'path_for', [$smartyPlugins, 'pathFor']);
    $view->registerPlugin('function', 'base_url', [$smartyPlugins, 'baseUrl']);

    return $view;
};
$controller = new EditorController($container);
$app->get('/{id}', [$controller, 'edit']);
$app->get('/', [$controller, 'search']);
$app->post('/{id}', [$controller, 'submit']);
$app->run();
