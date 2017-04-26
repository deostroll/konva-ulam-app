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

  // if (v._children.length) {
  //   v._children.forEach(function(ch){
  //     var blk = new Block(ch);
  //     self.add(blk);
  //   });
  // }
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
    self.add(cw/2, ch/2);
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
    var self = this;
    var stage = self._stage;
    var selected = null;
    stage.on('click', function onStageClicked(e){
      if (!selected) {
        if (e.target.parent.className === 'Vertex') {
          selected = e.target.parent;
          selected.activate();
        }
        else {
          //create new vertex
          var pos = stage.getPointerPosition();
          self.add(pos.x, pos.y);
        }
      }
      else if (e.target.parent.className === 'Vertex' && selected !== e.target.parent) {
        selected.deactivate();
        var newVertex = e.target.parent;
        self.connect(selected, newVertex);
        selected = null;
      }
      else {
        selected.deactivate();
        selected = null;
      }

    });
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
      console.log(this.isTree());
      if (this.isTree()) {
        this.arrange();
      }
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
    var vertexes = this._vertexes.slice();

    var LEVEL_MAX = -1
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

    for (var i = 0; i <= LEVEL_MAX; i++) {
      var levelBlocks = blocks.filter(function(b){
        return b.y === i;
      });

      if (i === 0) {
        //! 0th level

        console.assert(levelBlocks.length === 1);

      }
      else {
        var parentsAtLevel = levelBlocks.map(function(x){
          return x.parent;
        }).filter(function(x, i, arr){
          return arr.indexOf(x) === i
        });

        var groupLength = parentsAtLevel.length;

        for(var i = 0; i < groupLength; i++) {
          var groupBlocks = levelBlocks.filter(function(x){
            return x.parent === parentsAtLevel[i];
          });
          if (groupBlocks.length === 1) {
            groupBlocks.forEach(function(blk){
              blk.x = parentsAtLevel[i].x;
            });
          }
          else if(groupBlocks.length % 2 === 0) {
            //! group length even
            var halfLength = groupBlocks.length/2;
            var j;
            for(j = 0; j < halfLength; j++) {
              groupBlocks[j].x = j;
            }
            groupBlocks[0].parent.x += halfLength;

            for(j = halfLength; j < groupBlocks.length; j++) {
              groupBlocks[j].x = j + 1;
            }
          }//end if-else groupBlocks.length % 2 === 0
          else {
            //! group length odd
            var halfLength = Math.floor(groupBlocks.length/2);
            for(var j = 0, k = groupBlocks.length; j < k; j++) {
              if (j < halfLength) {
                groupBlocks[i].left = j;
              }
              else if(j > halfLength) {
                groupBlocks[i].left = j + 1;
              }
              else {
                groupBlocks[i].parent.left += halfLength;
              }
            }//end-for

          }//end if-else

        } // end for



      } //end if-else i === 0
    }//end for level iteration

    console.log(blocks.toString());

  },

  toString: function() {
    return this._vertexes.toString();
  }
};


window.addEventListener('load', function onWindowLoad(){
  var container = document.getElementById('container');
  var cw = container.clientWidth;
  var ch = innerHeight - container.offsetTop - 15;
  var stage = new Konva.Stage({
    container: container,
    height: ch,
    width: cw
  });

  var layer = new Konva.Layer();
  var rect = new Konva.Rect({
    height: ch,
    width: cw,
    stroke: 'black'
  });

  layer.add(rect);
  stage.add(layer);

  var treeLayer = new Konva.Layer({
    draggable: true
  });

  var tree = new Tree(treeLayer);
  stage.add(treeLayer);
  tree.on('ready', function(){
    console.log(tree);
  });
}, false)
