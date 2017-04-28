$(function(){

  var region = document.getElementById('region');
  var previewContainer = $('#json-preview-container');
  var jsonPreview = $('#json-preview');

  var $region = $(region);
  var stage = new Konva.Stage({
    container: region,
    height: innerHeight - $region.offset().top - $region.offset().left,
    width: $region.width()
  });

  var layer = new Konva.Layer({
    draggable: true
  });

  var tree = new Tree(layer);

  tree.on('ready', function onTreeReady(){

    $('#btnDraw').click(function(){
      var graph = JSON.parse(jsonPreview.val());
      tree.loadFromJson(graph);
    });

    var fileOpenCtrl = $('#fileOpen').change(function(e){
      var file = e.target.files[0];
      if (file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          jsonPreview.val(e.target.result);
          var graph = JSON.parse(e.target.result);
          tree.loadFromJson(graph);
        }

        reader.readAsText(file);
      }
    });


    $('#btnOpen').click(function(){
      fileOpenCtrl.trigger('click');
    });

    var togglePreviewButton = $('#toggle-preview').click(function(){
      // console.log('foo');
      previewContainer.toggle('fast', function(e){
        if (previewContainer.is(':hidden')) {
          togglePreviewButton.html('<small>show</small>');
        }
        else {
          togglePreviewButton.html('<small>hide</small>');
        }
      });
    });
  });

  stage.add(layer);

})
