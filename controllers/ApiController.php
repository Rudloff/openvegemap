<?php
/**
 * ApiController class.
 */
namespace OpenVegeMap\Controller;

use KageNoNeko\OSM\BoundingBox;
use OpenVegeMap\OsmApi;
use Slim\Http\Request as Request;
use Slim\Http\Response as Response;

/**
 * Controller for the GeoJSON API.
 */
class ApiController
{
    /**
     * Return features in the request bounding box.
     *
     * @param Request  $request  HTTP request
     * @param Response $response HTTP response
     *
     * @return Response JSON response
     */
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
