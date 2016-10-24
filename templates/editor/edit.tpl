{include file="editor/head.tpl"}
{$msg}
<h2>{$properties.name}</h2>
<table>
    {if isset($properties.amenity)}
        <tr><th>Type</th><td>{$properties.amenity}</td></tr>
    {/if}
    {if isset($properties.website)}
        <tr><th>Website</th><td><a target="_blank" href="{$properties.website}">{$properties.website}</a></td></tr>
    {/if}
</table>
<div class="my1">
    <a target="_blank" class="btn--blue" href="../#zoom=18&amp;lat={$coords.1}&amp;lon={$coords.0}">Display on map</a>
    <a target="_blank" class="btn--blue" href="http://www.openstreetmap.org/{$type}/{$id}">Open on OSM</a>
</div>
<form class="py1" method="post">
    <div class="grd">
        {foreach $editProperties as $property=>$label}
            <div class="grd-row my1">
                <label class="grd-row-col-2-6" for="{$property}">{$label}</label>
                <select class="grd-row-col-4-6" name="{$property}" id="{$property}">
                    <option value="">I don't know</option>
                    <option value="yes" {if isset($properties.$property) && $properties.$property == 'yes'}selected{/if}>Yes</option>
                    <option value="only" {if isset($properties.$property) && $properties.$property == 'only'}selected{/if}>Only</option>
                    <option value="no" {if isset($properties.$property) && $properties.$property == 'no'}selected{/if}>No</option>
                </select>
            </div>
        {/foreach}
    </div>
    <input type="submit" value="Save" />
</form>
{include file="editor/footer.tpl"}