<?php
/**
 * OsmApi class.
 */
namespace OpenVegeMap;

use FluidXml\FluidXml;
use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;
use KageNoNeko\OSM\BoundingBox;
use KageNoNeko\OSM\OverpassConnection;

/**
 * Manage calls to the various OpenStreetMap APIs.
 */
class OsmApi
{
    /**
     * Overpass query builder.
     *
     * @var OverpassBuilder
     */
    private $q;

    /**
     * Guzzle HTTP client.
     *
     * @var \GuzzleHttp\Client
     */
    private $client;

    /**
     * Main OSM API URL.
     *
     * @var string
     */
    private $apiUrl;

    /**
     * OSM tags that can be edited.
     *
     * @var string[]
     */
    const ALLOWED_TAGS = ['diet:vegan', 'diet:vegetarian'];

    /**
     * OsmApi constructor.
     *
     * @param string $apiUrl Main OSM API URL
     */
    public function __construct($apiUrl = 'http://api.openstreetmap.org/api/0.6/')
    {
        $osm = new OverpassConnection(['interpreter' => 'http://overpass-api.de/api/interpreter']);
        $osm->setQueryGrammar(new OverpassGrammar());
        $this->q = new OverpassBuilder($osm, $osm->getQueryGrammar());
        $this->client = new \GuzzleHttp\Client();
        $this->apiUrl = $apiUrl;
    }

    /**
     * Get OSM nodes with specificed tag prefix.
     *
     * @param string      $tag  Tag prefix to search for
     * @param BoundingBox $bbox Bounds to search in
     *
     * @return FeatureCollection Collection of nodes
     */
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

    /**
     * Get OSM node by ID.
     *
     * @param int $id OSM node ID
     *
     * @return Feature OSM node
     */
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

    /**
     * Get new OSM changeset ID.
     *
     * @return int Changeset ID
     */
    private function getChangeset()
    {
        $osm = new FluidXml('osm');
        $osm->add('changeset');
        $changeset = $osm->query('changeset');
        $changeset->add('tag', null, ['k' => 'comment', 'v' => 'Edited from openvegemap.netlib.re']);
        $changeset->add('tag', null, ['k' => 'created_by', 'v' => 'OpenVegeMap']);

        $result = $this->client->request(
            'PUT',
            $this->apiUrl.'changeset/create',
            [
                'auth' => [OSM_USER, OSM_PASS],
                'body' => $osm,
            ]
        );

        return (int) $result->getBody()->getContents();
    }

    /**
     * Update an OSM node with new tag values.
     *
     * @param int   $id   OSM node ID
     * @param array $tags Tags
     *
     * @return void
     */
    public function updateNode($id, array $tags)
    {
        $baseXml = $this->client->request(
            'GET',
            $this->apiUrl.'node/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
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
                    $node->add('tag', null, ['k' => $key, 'v' => $value]);
                }
            }
        }

        $this->client->request(
            'PUT',
            $this->apiUrl.'node/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
                'body' => $xml,
            ]
        );
    }
}
