<?php

namespace OpenVegeMap\Test;

use KageNoNeko\OSM\BoundingBox;
use OpenVegeMap\OsmApi;

class OsmApiTest extends \PHPUnit_Framework_TestCase
{
    protected function setUp()
    {
        $this->api = new OsmApi('http://api06.dev.openstreetmap.org/api/0.6/');
    }

    public function testGetPoisWithTag()
    {
        $collection = $this->api->getPoisWithTag('diet', new BoundingBox(48.569474, 7.739739, 48.580445, 7.778191));
        $this->assertInstanceOf('GeoJson\Feature\FeatureCollection', $collection);
        $features = $collection->getFeatures();
        $this->assertInstanceOf('GeoJson\Feature\Feature', $features[0]);
    }

    public function testgetById()
    {
        $id = 4165743782;
        $feature = $this->api->getById($id);
        $this->assertInstanceOf('GeoJson\Feature\Feature', $feature);
        $this->assertEquals($id, $feature->getId());
    }

    public function testUpdateNode()
    {
        $this->api->updateNode(4305148851, ['diet:vegan'=>'yes']);
    }
}
