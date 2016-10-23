<?php

namespace OpenVegeMap\Controller;

use OpenVegeMap\OsmApi;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Container;
use Plasticbrain\FlashMessages\FlashMessages;

class EditorController
{
    public function __construct(Container $container)
    {
        $this->container = $container;
        $this->api = new OsmApi();
        if (!session_id()) {
            session_start();
        }
        $this->msg = new FlashMessages();
        $this->msg->setCssClassMap([
            FlashMessages::SUCCESS => 'brdr--dark-gray p1 fnt--green',
            FlashMessages::ERROR => 'brdr--dark-gray p1 fnt--red'
        ]);
    }

    public function edit(Request $request, Response $response)
    {
        $feature = $this->api->getById($request->getAttribute('id'));
        $this->container->view->render(
            $response,
            'edit.tpl',
            [
                'properties'     => $feature->getProperties(),
                'coords'         => $feature->getGeometry()->getCoordinates(),
                'id'             => $feature->getId(),
                'msg'            => $this->msg->display(null, false),
                'editProperties' => [
                    'diet:vegan'      => 'Vegan',
                    'diet:vegetarian' => 'Vegetarian',
                ],
            ]
        );
    }

    public function submit(Request $request, Response $response)
    {
        try {
            $this->api->updateNode($request->getAttribute('id'), $request->getParsedBody());
            $this->msg->success('Your edit has been submitted, the map will be updated shortly.', null, true);
        } catch (\Exception $e) {
            $this->msg->error($e->getMessage(), null, true);
        }
        return $response->withRedirect($request->getUri());
    }
}
