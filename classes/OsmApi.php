<?php

namespace OpenVegeMap;

use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;
use KageNoNeko\OSM\BoundingBox;
use KageNoNeko\OSM\OverpassConnection;

class OsmApi
{
    public function getPoisWithTag($tag, BoundingBox $bbox)
    {
        $osm = new OverpassConnection(['interpreter' => 'http://overpass-api.de/api/interpreter']);
        $osm->setQueryGrammar(new OverpassGrammar());
        $q = new OverpassBuilder($osm, $osm->getQueryGrammar());
        $q = $q->element('node')->asJson();
        $q->whereTagStartsWith($tag);

        $result = json_decode($q->whereInBBox($bbox)->get()->getBody()->getContents());
        $pois = [];
        foreach ($result->elements as $node) {
            $pois[] = new Feature(new Point([$node->lon, $node->lat]), (array) $node->tags);
        }

        return new FeatureCollection($pois);
    }
}
