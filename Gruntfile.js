/* eslint-disable global-require */

module.exports = (grunt) => {
  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Configurable paths
  const config = {
    app: '.'
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    config,

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      dist: [
        'Gruntfile.js',
        '<%= config.app %>/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish'),
        verbose: true
      }
    },

    eslint: {
      target: [
        '.eslintrc.js',
        'Gruntfile.js',
        '<%= config.app %>/*.js',
        '<%= config.app %>/*.json'
      ]
    }
  });

  grunt.registerTask('default', [
    'jshint',
    'eslint'
  ]);
};
