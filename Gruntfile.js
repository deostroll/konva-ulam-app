module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.initConfig({

    watch: {
      dev: {
        files: ['index.html', 'style.css', 'script.js'],
        options: {
          livereload: '<%= connect.serve.options.livereload %>'
        }
      }
    },

    connect: {
      serve: {
        options: {
          livereload: true,
          hostname: '*'
        }
      }
    }
  });


  grunt.registerTask('default', ['connect', 'watch'])
}
