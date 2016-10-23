<?php

namespace OpenVegeMap\Controller;

use KageNoNeko\OSM\BoundingBox;
use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ApiController
{
    public function bbox(Request $request, Response $response)
    {
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
    }
}
