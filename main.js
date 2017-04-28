$(function(){

  var region = document.getElementById('region');
  var $params = $('#params');
  var $iterLevel = $('#iter-level');
  var $cust = $('#cust');

  var $region = $(region);
  var stage = new Konva.Stage({
    container: region,
    height: innerHeight - $region.offset().top - 25,
    width: $region.width()
  });

  var layer = new Konva.Layer({
    draggable: true
  });

  var tree = new Tree(layer);
  var isFrac = function(n) {
    return (n - Math.floor(n)) > 0;
  };

  tree.on('ready', function onTreeReady(){

    var generateCollatz = function(iterations) {
      tree._vertexes = [];
      tree._edges = [];
      tree._layer.removeChildren();

      var runOnce = false;
      var cache = {};

      var values = [{
        num: 1,
        type: 'root',
        parent: null
      }];
      for (var i = 0; i < iterations; i++) {
        var nodes = values.slice();
        values = [];

        while (nodes.length) {
          var n = nodes.shift();
          var color = {};

          if (!cache[n.num]) {
            if (n.type === 'root') {
              color.fill = 'green';
              color.text = 'white';
            }
            else if (n.type === 'even') {
              color.fill = 'lightyellow';
              color.text = 'black';
            }
            else if (n.type === 'odd') {
              color.fill = 'lightgreen';
              color.text = 'black';
            };

            var v = new Vertex({
              x: 0, y: 0,
              c: {
                fill: color.fill,
                stroke: 'black',
                strokeWidth: 1,
                radius: 15,
              },
              t: {
                text: n.num.toString(),
                fill: color.text,
              }
            });

            if (n.parent) {
              var parent = cache[n.parent.num];
              var child = v;
              tree.connect(child, parent);
            }
            cache[n.num] = v;
            tree._vertexes.push(v);

            if (n.num === 1) {
              values.push({
                num: 2,
                type: 'even',
                parent: n
              });
              continue;
            }

            values.push({
              num: n.num * 2,
              type: 'even',
              parent: n
            });
            var nextNum = (n.num - 1)/3;
            if (!isFrac( nextNum ) && nextNum % 2 !== 0) {
              values.push({
                num: (n.num - 1)/3,
                type: 'odd',
                parent: n
              });
            }
          }//end if
          else {
            console.log('Cycle:', n, 'Iteration:', i);
          }

        }//end while
      }//end for

      tree.arrange();

      var layer = tree._layer;

      var layerRect = layer.getClientRect();
      console.log('Layer:', layerRect);
      console.log('Stage:', tree._stage.width(), tree._stage.height());
      var aspect = layerRect.width/layerRect.height;

      var factor = 1;

      if (layerRect.width > layerRect.height) {
        if (layerRect.width > tree._stage.width()) {
          factor = tree._stage.width() / (layerRect.width + layerRect.x);
        }
      }
      else {
        if (layerRect.height > tree._stage.height()) {
          factor = tree._stage.height()/(layerRect.height + layerRect.y);
        }
      }

      layer.scaleX(factor);
      layer.scaleY(factor);
      layer.draw();

    }; //end generateCollatz Fn

    var $settings = $('#settings').click(function(){
      $params.toggle(function(){
        if ($params.is(':hidden')) {
          $settings.html('Show settings');
        }
        else {
          $settings.html('Hide settings');
        }
      });
    });

    $iterLevel.change(function(){
      if ($iterLevel.val() === '-1') {
        $cust.removeAttr('disabled');
      }
      else {
        $cust.attr('disabled', '');
      }
    });

    $('#btnGenerate').click(function() {
      var iterations;
      if ($iterLevel.val() === -1) {
        try {
          iterations = parseInt($cust.val())
        } catch (e) {
          alert('Custom iter value not interger');
          return;
        }
      }
      else {
        iterations = parseInt($iterLevel.val());
      }

      generateCollatz(iterations);

    });

    generateCollatz(15);
  });

  stage.add(layer);

})
