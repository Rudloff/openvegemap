<?php

namespace OpenVegeMap;

class OverpassGrammar extends \KageNoNeko\OSM\Query\Grammars\OverpassGrammar
{
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
