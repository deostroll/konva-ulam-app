module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.initConfig({

    watch: {
      dev: {
        files: ['index.html', 'style.css', '*.js'],
        options: {
          livereload: '<%= connect.serve.options.livereload %>'
        }
      }
    },

    connect: {
      serve: {
        options: {
          livereload: 35730,
          hostname: '*'
        }
      }
    }
  });


  grunt.registerTask('default', ['connect', 'watch'])
}
