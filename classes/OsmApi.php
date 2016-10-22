<?php

namespace OpenVegeMap;

use KageNoNeko\OSM\BoundingBox;
use KageNoNeko\OSM\OverpassConnection;
use GeoJson\Geometry\Point;
use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;

class OsmApi
{
    public function getPoiWithTags(array $tags)
    {
        $bbox = new BoundingBox(48.5712, 7.7273, 48.5931, 7.7708);

        $osm = new OverpassConnection(['interpreter' => 'http://overpass-api.de/api/interpreter']);

        $q = $osm->element('node')->asJson();
        foreach ($tags as $key => $value) {
            if (is_int($key)) {
                $q->whereTagExists($value);
            } else {
                $q->whereTag($key, $value);
            }
        }

        $result = json_decode($q->whereInBBox($bbox)->get()->getBody()->getContents());
        $pois = [];
        foreach ($result->elements as $node) {
            $pois[] = new Feature(new Point([$node->lon, $node->lat]), (array) $node->tags);
        }

        return new FeatureCollection($pois);
    }
}
