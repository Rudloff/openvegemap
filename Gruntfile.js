/*jslint node: true */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig(
        {
            jslint: {
                meta: {
                    src: ['*.js']
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
                    postUpdateCmd: 'yarn install --prod'
                }
            }
        }
    );

    require('grunt-loadnpmtasks').extend(grunt);
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shipit');
    grunt.loadNpmTasks('shipit-git-update');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'csslint']);
    grunt.registerTask('default', ['cssmin']);
    grunt.registerTask('prod', ['shipit:prod', 'update']);
};
