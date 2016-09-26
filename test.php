<!DOCTYPE HTML>
<?php

use OpenVegeMap\OsmApi;

require_once 'vendor/autoload.php';

$api = new OsmApi();

$pois = $api->getPoiWithTags(['diet:vegan']);
?>
<ul>
    <?php
    foreach ($pois as $poi) {
        echo '<li><h3>'.$poi->name.'</h3><dl>';
        foreach ($poi->tags as $tag => $value) {
            echo '<dt>'.$tag.'</dt>';
            echo '<dd>'.$value.'</dd>';
        }
        echo '</dl></li>';
    }
    ?>
</ul>
