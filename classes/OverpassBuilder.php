<?php
/**
 * OverpassBuilder class.
 */
namespace OpenVegeMap;

/**
 * Extended OverpassBuilder class in order to manage regexp in tag names.
 */
class OverpassBuilder extends \KageNoNeko\OSM\Query\OverpassBuilder
{
    /**
     * Search for tags that start with a certain prefix.
     *
     * @param string $tag     Tag prefix to search for
     * @param string $element Type of element that contains the tag
     *
     * @return OverpassBuilder
     */
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

    /**
     * Get the center point of a way
     * @return OverpassBuilder
     */
    public function getCenter()
    {
        $this->out['center'] = 'center';

        return $this;
    }
}
