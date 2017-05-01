// console.log('Hello world');

function Block(v) {
  this.x = 0;
  this.y = v._level;
  this.childs = [];
  this.parent = null;
  Object.defineProperty(this, 'vertex', {
    enumerable: false,
    value: v
  });
  var self = this;

  this.add = function(block) {
    block.parent = this;
    self.childs.push(block);
  };

  this.toString = function () {
    return JSON.stringify({
      x: this.x,
      y: this.y,
      z: this.vertex._value
    });
  }

}

function Vertex(opts) {
  Konva.Group.call(this, opts);
  // this.nodeType = 'Vertex';
  this.className = 'Vertex'
  this._opts = opts;
  this._tree = opts.tree;
  this._children = [];
  this._parent = null;
  this._value = opts.t.text;
  this._level = 0;
  this.$init();
}

Vertex.prototype = {
  $init: function() {
    var opts = this._opts;
    var circle = new Konva.Circle(opts.c);
    var t = new Konva.Text(opts.t);
    var tr = t.getClientRect();
    t.offset({
      x: tr.width/2,
      y: tr.height/2
    });
    this.add(circle);
    this.add(t);
  },
  activate: function() {
    var c = this.findOne('Circle');
    c.stroke('red');
    this._tree._draw();
  },
  deactivate: function() {
    var c = this.findOne('Circle');
    c.stroke('black');
    this._tree._draw();
  },
  hasChild: function(vertex) {
    return this._children.indexOf(vertex) > -1;
  },
  addChild: function(vertex) {
    var self = this;
    this._children.push(vertex);

    var levelSet = function(cur, prev) {
      cur._level = prev._level + 1;
      if (cur._children.length) {
        cur._children.forEach(function(cv){
          levelSet(cv, cur);
        });
      }
    };

    levelSet(vertex, this);

  },
  setParent: function(vertex) {
    this._parent = vertex;
  },
  toString: function() {
    return '('+ this._value + ',' + this._level + (this._level ? ',' + this._parent._value : '') + ')'
  }
}

Konva.Util.extend(Vertex, Konva.Group)

function Tree(layer) {
  this._layer = layer;
  this._counter = 0;
  this._dim = {};
  this._eventCache = {};
  this._vertexes = [];
  var self = this;
  this._edges = [];
  setTimeout(function(){
    var cw, ch;
    cw = self._dim.cw = layer.parent.getWidth();
    ch = self._dim.ch = layer.parent.getHeight();
    // self.add(cw/2, ch/2);
    self._stage = layer.parent;
    self._init();
    self._eventCache['ready'].call(self);
  }, 10);
}

Tree.prototype = {

  add: function(x, y) {
    var layer = this._layer;
    var v = new Vertex({
      x: x,
      y: y,
      c: {
        radius: 15,
        fill: 'lightgreen',
        stroke: 'black'
      },
      t: {
        text: (this._counter++).toString(),
        fill: 'black',
        fontSize: 12
      },
      draggable: true,
      tree: this
    });
    layer.add(v);
    layer.draw();
    this._vertexes.push(v);
  },

  on: function(eventName, fn) {
    this._eventCache[eventName] = fn;
  },

  _init: function() {
    //doing nothing here
  },

  _draw: function() {
    this._layer.draw();
  },

  connect: function(child, parent) {
    if (!parent.hasChild(child)) {
      parent.addChild(child);
      child.setParent(parent);
      this._edges.push({
        from: parent,
        to: child
      });
      // console.log(this.isTree());
      // if (this.isTree()) {
      //   this.arrange();
      // }
    }
  },

  isTree: function() {
    var self = this;
    var vertexes = this._vertexes;
    var root = vertexes[0];
    var flag = true;
    for(var i = 1, j = vertexes.length; i < j && flag; i++) {
      var v = vertexes[i];
      while(v && v !== root) {
        v = v._parent;
      }
      flag = v === root;
    }
    return flag;
  },

  arrange: function() {
    var self = this;

    var vertexes = this._vertexes.slice();

    var LEVEL_MAX = -1;

    var blocks = vertexes.map(function(x){
      if (LEVEL_MAX < x._level) {
        LEVEL_MAX = x._level;
      }
      var block = new Block(x);
      return block;
    });

    var visit = function(v){
      var block = blocks[vertexes.indexOf(v)];
      for(var k = 0, j = v._children.length; k < j; k++) {
        var child_block = blocks[vertexes.indexOf(v._children[k])];
        block.add(child_block);
        visit(v._children[k]);
      }
    };

    visit(vertexes[0]);

    var graphArray = [blocks[0]];

    var expandRight = function(p, length) {
      var offset;
      if (length === 1) {
        offset = 0;
      }
      else if(length % 2 === 0) {
        offset = length;
      }
      else {
        offset = length - 1;
      }

      if (offset > 0) {
        graphArray.filter(function(b){
          return b.x > p.x && b.y <= p.y;
        }).forEach(function(b){
          b.x += offset;
        });
      }

      // p.x += Math.floor(offset / 2);
      var parentOffset = Math.floor(offset/2);

      if (p.y > 0) {
        graphArray.filter(function(b) {
          return b.x === p.x && b.y < p.y;
        })
        .forEach(function(b){
          b.x += parentOffset;
        });
      }
      // else {
      //   p.x += parentOffset;
      // }
      p.x += parentOffset;

    };

    var drawBlocks = function(levelBlocks) {

      var group = new Konva.Group({
        x: 100, y: 100
      });
      var r = vertexes[0].getClientRect();
      var unitWidth = r.width + 10;
      var unitHeight = r.height + 50;

      for(var y = 0; y <= LEVEL_MAX; y++) {
        var levelBlocks = blocks.filter(function(x){
          return x.y === y;
        });

        levelBlocks.forEach(function(b, idx){
          var v = b.vertex;
          group.add(v);
          var x = unitWidth * b.x;
          var y = unitHeight * b.y;
          v.position({
            x: x, y: y
          })
        }); //levelBlocks.forEach
      } //end-for

      var edges = self._edges;
      var d = r.width / 2;
      var pi = Math.PI;
      for(var i = 0, j = edges.length; i < j; i++) {
        var edge = edges[i];
        var original = {
          from: edge.from.position(),
          to: edge.to.position()
        };
        if (original.to.x === original.from.x) {
          var arrow = new Konva.Arrow({
            x: original.from.x,
            y: original.from.y + d,
            points: [
              0,0,
              0, original.to.y - original.from.y - 2*d
            ],
            fill: 'black',
            stroke: 'black',
            pointerWidth: 5,
            pointerLength: 5
          });
          group.add(arrow);
        }
        else {
          // var m = (original.to.y - original.from.y) / (original.to.x - original.from.x);
          var theta = Math.atan2(original.to.y - original.from.y, original.to.x - original.from.x);
          var final = {
            from: {
              x: original.from.x + d * Math.cos(theta),
              y: original.from.y + d * Math.sin(theta)
            },
            to: {
              x: original.to.x - d * Math.cos(theta),
              y: original.to.y - d * Math.sin(theta)
            }
          };


          var arrow = new Konva.Arrow({
            x: final.from.x,
            y: final.from.y,
            points: [
              0,0,
              final.to.x - final.from.x, final.to.y - final.from.y
            ],
            fill: 'black',
            stroke: 'black',
            pointerWidth: 5,
            pointerLength: 5
          });


          group.add(arrow);
        }

      }//end for

      self._layer.add(group);

      self._draw();
    };

    for (var i = 1; i <= LEVEL_MAX; i++) {
      var levelBlocks = blocks.filter(function(b){
        return b.y === i;
      });

      graphArray = graphArray.concat(levelBlocks);

      var parents = levelBlocks.map(function(b){
        return b.parent;
      }).filter(function(b, idx, arr){
        return arr.indexOf(b) === idx;
      });

      parents.forEach(function(p){
        var parentX = p.x;

        var size = p.childs.length;
        var halfLength = Math.ceil(size/2);

        for(var j = 0, offset = 0; j < size; j++) {
          if (j === halfLength && size % 2 === 0) {
            offset = 1;
          }
          p.childs[j].x = parentX + j + offset;
        }

        expandRight(p, size);

      }); //parent foreach

    }//end for level iteration

    console.log(blocks.join('\r\n'));

    drawBlocks(levelBlocks);

  },

  toString: function() {
    return this._vertexes.toString();
  },

  loadFromJson: function(graph) {
    var self = this;

    self._layer.removeChildren();

    var vertexes = graph.v.map(function(v){
      var v = new Vertex({
        x: 0,
        y: 0,
        c: {
          radius: 15,
          fill: 'lightgreen',
          stroke: 'black',
          strokeWidth: 1
        },
        t: {
          text: v.toString(),
          fontSize: 12,
          fill:'black'
        },
        tree: self
      });
      return v;
    });

    self._vertexes = vertexes;

    graph.e.forEach(function(edge){
      var child = self._vertexes[edge[1]];
      var parent = self._vertexes[edge[0]];

      self.connect(child, parent);
    });

    if (self.isTree()) {
      self.arrange();
    }
    else {
      console.log('Not a tree');
    }
  }
};

//
// window.addEventListener('load', function onWindowLoad(){
//   var container = document.getElementById('container');
//   var cw = container.clientWidth;
//   var ch = innerHeight - container.offsetTop - 15;
//   var stage = new Konva.Stage({
//     container: container,
//     height: ch,
//     width: cw
//   });
//
//   var layer = new Konva.Layer();
//   var rect = new Konva.Rect({
//     height: ch,
//     width: cw,
//     stroke: 'black'
//   });
//
//   layer.add(rect);
//   stage.add(layer);
//
//   var treeLayer = new Konva.Layer({
//     draggable: true
//   });
//
//   var tree = new Tree(treeLayer);
//   stage.add(treeLayer);
//   tree.on('ready', function(){
//     console.log(tree);
//   });
// }, false)
