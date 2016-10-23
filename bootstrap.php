<?php

require_once __DIR__.'/vendor/autoload.php';
if (getenv('OSM_USER')) {
    define('OSM_USER', getenv('OSM_USER'));
    define('OSM_PASS', getenv('OSM_PASS'));
} else {
    require_once __DIR__.'/config_test.php';
}
