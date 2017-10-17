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
            uglify: {
                js: {
                    files: {
                        'dist/map.js': ['js/oldbrowser.js', 'js/map.js']
                    },
                    options: {
                        sourceMap: true
                    }
                }
            },
            cssmin: {
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
                    postUpdateCmd: 'yarn install; ./node_modules/.bin/grunt'
                }
            },
            imagemin: {
                dependencies: {
                    files: {
                        'dist/images/leaflet-loader.gif': 'node_modules/@bower_components/leaflet-loader/images/leaflet-loader.gif',
                        'dist/images/markers-shadow.png': 'node_modules/@bower_components/Leaflet.awesome-markers/dist/images/markers-shadow.png',
                        'dist/images/markers-shadow@2x.png': 'node_modules/@bower_components/Leaflet.awesome-markers/dist/images/markers-shadow@2x.png',
                        'dist/images/markers-soft.png': 'node_modules/@bower_components/Leaflet.awesome-markers/dist/images/markers-soft.png',
                        'dist/images/markers-soft@2x.png': 'node_modules/@bower_components/Leaflet.awesome-markers/dist/images/markers-soft@2x.png'
                    }
                }
            }
        }
    );

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shipit');
    grunt.loadNpmTasks('shipit-git-update');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'csslint']);
    grunt.registerTask('default', ['uglify', 'cssmin', 'imagemin']);
    grunt.registerTask('prod', ['shipit:prod', 'update']);
};
