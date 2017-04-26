function Vertex(opts) {
  Konva.Group.call(this, opts);
  // this.nodeType = 'Vertex';
  this.className = 'Vertex'
  this._opts = opts;
  this._tree = opts.tree;
  this._children = [];
  this._parent = null;
  this._value = opts.t.text;
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
    this._children.push(vertex);
  },
  setParent: function(vertex) {
    this._parent = vertex;
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
    }
  },
  isTree: function() {
    var self = this;
    var vertexes = this._vertexes;
    var root = vertexes[0];
    for(var i = 1, j = vertexes.length; i < j; i++) {
      var v = vertexes[i];
      while(v && v !== root) {
        v = v._parent;
      }
      if (v === root) {
        return true;
      }
    }
    return false;
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
    console.log('tree rea');
  });
}, false)
