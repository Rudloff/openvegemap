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
            csslint: {
                css: {
                    src: ['css/*.css']
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
                bower: {
                    files: {
                        'dist/bower.css': 'dist/_bower.css'
                    }
                },
                css: {
                    files: {
                        'dist/map.css': 'css/map.css'
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
                    tasks: ['cssmin:css']
                }
            },
            shipit: {
                prod: {
                    deployTo: '/var/www/openvegemap/',
                    servers: 'pierre@dev.rudloff.pro',
                    postUpdateCmd: './node_modules/.bin/bower install; ./node_modules/.bin/bower prune; ./node_modules/.bin/grunt'
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
    grunt.loadNpmTasks('grunt-shipit');
    grunt.loadNpmTasks('shipit-git-update');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'csslint']);
    grunt.registerTask('default', ['bower_concat', 'uglify', 'cssmin']);
    grunt.registerTask('prod', ['shipit:prod', 'update']);
};
