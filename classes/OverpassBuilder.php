<?php

namespace OpenVegeMap;

class OverpassBuilder extends \KageNoNeko\OSM\Query\OverpassBuilder
{
    public function whereTagStartsWith($tag, $element = null)
    {
        $element = $this->assertElementWheres($element);
        $type = 'TagExpression';
        $operator = '~';
        $value = '.';
        $tag = '^'.$tag.':.*$';
        $this->wheres[$element][$type][] = compact('tag', 'operator', 'value');

        return $this;
    }
}
