<?php

use OpenVegeMap\Controller\ApiController;

require_once __DIR__.'/../vendor/autoload.php';

$app = new \Slim\App();
$controller = new ApiController();
$app->get('/{south}/{west}/{north}/{east}', [$controller, 'bbox']);
$app->run();
