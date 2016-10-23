/*jslint node: true */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig(
        {
            phpcs: {
                options: {
                    standard: 'PSR2',
                    bin: 'vendor/bin/phpcs'
                },
                php: {
                    src: ['*.php', 'classes/*.php', 'controllers/*.php', 'api/*.php', 'editor/*.php']
                },
                tests: {
                    src: ['tests/']
                }
            },
            jslint: {
                Gruntfile: {
                    src: ['Gruntfile.js']
                },
                js: {
                    src: 'js/*.js'
                }
            },
            phpunit: {
                options: {
                    bin: 'php -dzend_extension=xdebug.so ./vendor/bin/phpunit',
                    stopOnError: true,
                    stopOnFailure: true,
                    followOutput: true
                },
                classes: {
                    dir: 'tests/'
                }
            },
            jsonlint: {
                manifests: {
                    src: ['*.json'],
                    options: {
                        format: true
                    }
                }
            },
            fixpack: {
                package: {
                    src: 'package.json'
                }
            },
            bower_concat: {
                css: {
                    dest: {
                        'css': 'dist/_bower.css'
                    },
                    exclude: ['leaflet-loader', 'Leaflet.awesome-markers', 'onsenui']
                },
                js: {
                    dest: {
                        'js': 'dist/_bower.js'
                    },
                    exclude: ['furtive'],
                    dependencies: {
                        'Leaflet.awesome-markers': 'leaflet'
                    },
                    mainFiles: {
                        'leaflet-control-geocoder': 'dist/Control.Geocoder.js'
                    }
                }
            },
            uglify: {
                dist: {
                    files: {
                        'dist/bower.js': 'dist/_bower.js'
                    }
                }
            },
            cssmin: {
                dist: {
                    files: {
                        'dist/bower.css': 'dist/_bower.css'
                    }
                }
            }
        }
    );

    grunt.loadNpmTasks('grunt-phpcs');
    grunt.loadNpmTasks('grunt-phpunit');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'phpcs']);
    grunt.registerTask('test', ['phpunit']);
    grunt.registerTask('default', ['bower_concat', 'uglify', 'cssmin']);
};
