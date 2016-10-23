<?php

require_once __DIR__.'/vendor/autoload.php';
if (getenv('OSM_USER')) {
    require_once __DIR__.'/getenv.php';
} else {
    require_once __DIR__.'/config_test.php';
}
