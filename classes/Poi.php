<?php

namespace OpenVegeMap;

use Location\Coordinate;

class Poi
{
    public $name;
    public $coords;
    public $tags;

    public function __construct($name, Coordinate $coords, $tags)
    {
        $this->name = $name;
        $this->coords = $coords;
        $this->tags = $tags;
    }
}
