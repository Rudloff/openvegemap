<?php

namespace OpenVegeMap;

use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;
use KageNoNeko\OSM\BoundingBox;
use KageNoNeko\OSM\OverpassConnection;

class OsmApi
{
    private $q;

    public function __construct()
    {
        $osm = new OverpassConnection(['interpreter' => 'http://overpass-api.de/api/interpreter']);
        $osm->setQueryGrammar(new OverpassGrammar());
        $this->q = new OverpassBuilder($osm, $osm->getQueryGrammar());
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
}
