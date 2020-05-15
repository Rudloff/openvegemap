/**
 * Initialize Grunt config.
 * @param {Object} grunt
 * @param {Function} grunt.initConfig
 * @param {Function} grunt.loadNpmTasks
 * @param {Function} grunt.registerTask
 */
function initGruntConfig(grunt) {
    'use strict';
    grunt.initConfig(
        {
            jshint: {
                options: {
                    esversion: 6
                },
                js: {
                    src: 'js/*.js'
                },
                meta: {
                    src: '*.js'
                },
                tests: {
                    src: 'tests/*.js'
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
            watch: {
                js: {
                    files: ['js/*.js'],
                    tasks: ['webpack']
                },
                css: {
                    files: ['css/*.css'],
                    tasks: ['webpack']
                }
            },
            webpack: {
                prod: require('./webpack.config.js'),
                dev: Object.assign({watch: true, optimization: {minimize: false}}, require('./webpack.config.js'))
            },
            qunit: {
                files: ['tests/index.html']
            }
        }
    );

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('lint', ['jshint', 'fixpack', 'jsonlint', 'csslint']);
    grunt.registerTask('default', ['webpack:prod']);
    grunt.registerTask('watch', ['webpack:dev']);
    grunt.registerTask('test', ['qunit']);
}

module.exports = initGruntConfig;
