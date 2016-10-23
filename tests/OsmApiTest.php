<?php
/**
 * OsmApiTest class.
 */
namespace OpenVegeMap\Test;

use KageNoNeko\OSM\BoundingBox;
use OpenVegeMap\OsmApi;

/**
 * Tests for the OsmApi class.
 */
class OsmApiTest extends \PHPUnit_Framework_TestCase
{
    /**
     * OsmApi instance.
     *
     * @var OsmApi
     */
    private $api;

    /**
     * Setup properties used in multiple tests.
     */
    protected function setUp()
    {
        $this->api = new OsmApi('http://api06.dev.openstreetmap.org/api/0.6/');
    }

    /**
     * Test the getPoisWithTag() function.
     *
     * @return void
     */
    public function testGetPoisWithTag()
    {
        $collection = $this->api->getPoisWithTag('diet', new BoundingBox(48.569474, 7.739739, 48.580445, 7.778191));
        $this->assertInstanceOf('GeoJson\Feature\FeatureCollection', $collection);
        $features = $collection->getFeatures();
        $this->assertInstanceOf('GeoJson\Feature\Feature', $features[0]);
    }

    /**
     * Test the getById() function.
     *
     * @return void
     */
    public function testgetById()
    {
        $id = 4165743782;
        $feature = $this->api->getById($id);
        $this->assertInstanceOf('GeoJson\Feature\Feature', $feature);
        $this->assertEquals($id, $feature->getId());
    }

    /**
     * Test the updateNode() function.
     *
     * @return void
     */
    public function testUpdateNode()
    {
        $this->api->updateNode(4305148851, ['diet:vegan' => 'yes']);
    }
}
