<?php
/**
 * OsmApi class.
 */
namespace OpenVegeMap;

use FluidXml\FluidXml;
use GeoJson\Feature\Feature;
use GeoJson\Geometry\Point;
use KageNoNeko\OSM\OverpassConnection;

/**
 * Manage calls to the various OpenStreetMap APIs.
 */
class OsmApi
{
    /**
     * Overpass API connection.
     *
     * @var OverpassConnection
     */
    private $osm;

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
        $this->client = new \GuzzleHttp\Client();
        $this->apiUrl = $apiUrl;
    }

    /**
     * Get OSM node by ID.
     *
     * @param string $type OSM type (node or way)
     * @param int    $id   OSM node ID
     *
     * @return Feature OSM node
     */
    public function getById($type, $id)
    {
        $result = $this->client->request(
            'GET',
            $this->apiUrl.$type.'/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
            ]
        );
        $xml = new FluidXml(null);
        $xml->addChild($result->getBody()->getContents());
        $tags = [];
        foreach ($xml->query('tag') as $tag) {
            $tags[$tag->getAttribute('k')] = $tag->getAttribute('v');
        }
        $node = $xml->query($type);

        return new Feature(
            new Point([(int) $node[0]->getAttribute('lon'), (int) $node[0]->getAttribute('lat')]),
            $tags,
            $node[0]->getAttribute('id')
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
     * @param string $type OSM type (node or way)
     * @param int    $id   OSM node ID
     * @param array  $tags Tags
     *
     * @return void
     */
    public function updateNode($type, $id, array $tags)
    {
        $baseXml = $this->client->request(
            'GET',
            $this->apiUrl.$type.'/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
            ]
        )->getBody()->getContents();

        $xml = new FluidXml(null);
        $xml->addChild($baseXml);
        $node = $xml->query($type);
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
            $this->apiUrl.$type.'/'.$id,
            [
                'auth' => [OSM_USER, OSM_PASS],
                'body' => $xml,
            ]
        );
    }
}
