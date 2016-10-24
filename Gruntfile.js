/*jslint node: true */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig(
        {
            jslint: {
                Gruntfile: {
                    src: ['Gruntfile.js']
                },
                js: {
                    src: 'js/*.js'
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
                    dependencies: {
                        'Leaflet.awesome-markers': 'leaflet'
                    },
                    mainFiles: {
                        'leaflet-control-geocoder': 'dist/Control.Geocoder.js',
                        'leaflet-plugins': 'control/Permalink.js'
                    }
                }
            },
            uglify: {
                bower: {
                    files: {
                        'dist/bower.js': 'dist/_bower.js'
                    },
                    options: {
                        sourceMap: true
                    }
                },
                js: {
                    files: {
                        'dist/map.js': 'js/map.js'
                    },
                    options: {
                        sourceMap: true
                    }
                }
            },
            cssmin: {
                dist: {
                    files: {
                        'dist/bower.css': 'dist/_bower.css'
                    }
                }
            },
            watch: {
                js: {
                    files: ['js/*.js'],
                    tasks: ['uglify:js']
                },
                css: {
                    files: ['css/*.css'],
                    tasks: ['cssmin']
                }
            }
        }
    );

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint']);
    grunt.registerTask('default', ['bower_concat', 'uglify', 'cssmin']);
};
