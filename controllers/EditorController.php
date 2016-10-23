<?php

namespace OpenVegeMap\Controller;

use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Container;

class EditorController
{
    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    public function edit(Request $request, Response $response)
    {
        $api = new OsmApi();
        $feature = $api->getById($request->getAttribute('id'));
        $this->container->view->render(
            $response,
            'edit.tpl',
            [
                'properties'     => $feature->getProperties(),
                'coords'         => $feature->getGeometry()->getCoordinates(),
                'id'             => $feature->getId(),
                'editProperties' => [
                    'diet:vegan'      => 'Vegan',
                    'diet:vegetarian' => 'Vegetarian',
                ],
            ]
        );
    }
}
