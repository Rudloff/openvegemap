# OpenVegeMap

Find vegetarian and vegan restaurants in your city

## Setup

```bash
yarn install
```

## Android app

OpenVegeMap is also available as [an Android app](https://github.com/Rudloff/openvegemap-cordova).

[![Get it on Google Play](https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=pro.rudloff.openvegemap)

[![Get it on F-Droid](https://f-droid.org/badge/get-it-on.png)](https://f-droid.org/packages/pro.rudloff.openvegemap/)

## How to contribute

All the data comes from [OpenStreetMap](https://www.openstreetmap.org/).
The map displays every node or way that has a `diet:` tag.

There are several ways to contribute:

* Add data directly on [OpenStreetMap](https://www.openstreetmap.org/edit).
    You need to use the [`diet:vegan` and `diet:vegetarian` tags](https://wiki.openstreetmap.org/wiki/Key:diet).
* We provide a [simple web editor](https://editor.openvegemap.netlib.re/) that allows you to edit existing restaurants.
* The [StreetComplete](https://github.com/westnordost/StreetComplete/) Android app asks info about vegetarian and vegan restaurants.
