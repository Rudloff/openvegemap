<?php
/**
 * OverpassGrammar class
 */
namespace OpenVegeMap;

/**
 * Extended OverpassGrammar class in order to manage regexp in tag names
 */
class OverpassGrammar extends \KageNoNeko\OSM\Query\Grammars\OverpassGrammar
{
    /**
     * Compile tag regular expressions into an overpass query
     * @param  array  $where Tag expressions
     * @return string Overpass query segment
     */
    protected function compileWhereTagExpression(array $where)
    {
        $ql = [];
        foreach ($where as $whereTag) {
            $tag = addslashes($whereTag['tag']);
            $value = addslashes($whereTag['value']);
            $ql[] = "[~\"{$tag}\"{$whereTag['operator']}\"{$value}\"]";
        }

        return implode('', $ql);
    }
}
