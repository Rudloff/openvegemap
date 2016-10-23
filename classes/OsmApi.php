<?php

namespace OpenVegeMap;

use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;
use KageNoNeko\OSM\BoundingBox;
use KageNoNeko\OSM\OverpassConnection;
use FluidXml\FluidXml;

class OsmApi
{
    private $q;

    const API = 'http://api.openstreetmap.org/api/0.6/';
    const ALLOWED_TAGS = ['diet:vegan', 'diet:vegetarian'];

    public function __construct()
    {
        $osm = new OverpassConnection(['interpreter' => 'http://overpass-api.de/api/interpreter']);
        $osm->setQueryGrammar(new OverpassGrammar());
        $this->q = new OverpassBuilder($osm, $osm->getQueryGrammar());
        $this->client = new \GuzzleHttp\Client();
    }

    public function getPoisWithTag($tag, BoundingBox $bbox)
    {
        $q = $this->q->element('node')->asJson()->whereTagStartsWith($tag);

        $result = json_decode($q->whereInBBox($bbox)->get()->getBody()->getContents());
        $pois = [];
        foreach ($result->elements as $node) {
            $pois[] = new Feature(new Point([$node->lon, $node->lat]), (array) $node->tags, $node->id);
        }

        return new FeatureCollection($pois);
    }

    public function getById($id)
    {
        $q = $this->q->element('node')->asJson()->whereId($id);
        $result = json_decode($q->get()->getBody()->getContents());

        return new Feature(
            new Point([$result->elements[0]->lon, $result->elements[0]->lat]),
            (array) $result->elements[0]->tags,
            $result->elements[0]->id
        );
    }

    private function getChangeset()
    {
        $osm = new FluidXml('osm');
        $osm->add('changeset');
        $changeset = $osm->query('changeset');
        $changeset->add('tag', null, ['k'=>'comment', 'v'=>'Edited from openvegemap.netlib.re']);
        $changeset->add('tag', null, ['k'=>'created_by', 'v'=>'OpenVegeMap']);

        $result = $this->client->request(
            'PUT',
            self::API.'changeset/create',
            [
                'auth' => [OSM_USER, OSM_PASS],
                'body' => $osm
            ]
        );
        return (int) $result->getBody()->getContents();
    }

    public function updateNode($id, array $tags)
    {
        $baseXml = $this->client->request(
            'GET',
            self::API.'node/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS]
            ]
        )->getBody()->getContents();

        $xml = new FluidXml(null);
        $xml->addChild($baseXml);
        $node = $xml->query('node');
        $node->attr('changeset', $this->getChangeset());
        $node->attr('timestamp', date('c'));
        foreach ($tags as $key => $value) {
            if (!empty($value) && in_array($key, self::ALLOWED_TAGS)) {
                $tag = $node->query('tag[k="'.$key.'"]');
                if ($tag->size() > 0) {
                    $tag->attr('v', $value);
                } else {
                    $node->add('tag', null, ['k'=>$key, 'v'=>$value]);
                }
            }
        }

        $this->client->request(
            'PUT',
            self::API.'node/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
                'body' => $xml
            ]
        );
    }
}
