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
                    src: ['*.php', 'classes/*.php', 'controllers/*.php']
                },
                tests: {
                    src: ['tests/']
                }
            },
            jslint: {
                Gruntfile: {
                    src: ['Gruntfile.js']
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
            }
        }
    );

    grunt.loadNpmTasks('grunt-phpcs');
    grunt.loadNpmTasks('grunt-phpunit');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-fixpack');

    grunt.registerTask('lint', ['jslint', 'fixpack', 'jsonlint', 'phpcs']);
    grunt.registerTask('test', ['phpunit']);
};
