/*jslint node: true */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig(
        {
            jslint: {
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

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'csslint']);
    grunt.registerTask('default', ['webpack:prod']);
    grunt.registerTask('watch', ['webpack:dev']);
    grunt.registerTask('test', ['qunit']);
};
