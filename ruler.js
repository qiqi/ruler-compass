"use strict";

var Class = function(methods) {
    var klass = function() {
        this.initialize.apply(this, arguments);
    };

    for (var property in methods) {
       klass.prototype[property] = methods[property];
    }

    if (!klass.prototype.initialize) klass.prototype.initialize = function(){};

    return klass;
};

var canvas;
var context;

var Point = Class({ 
    initialize: function(x, y) {
        this.x = x;
        this.y = y;
    },
    draw: function() {
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2*Math.PI);
        context.stroke();
    },
    distance: function (x, y) {
        var dx = this.x - x;
        var dy = this.y - y;
        return Math.sqrt(dx*dx + dy*dy);
    }
});

var Line = Class ({
    initialize: function(p0, p1) {
        this.type = 'Line';
        this.p0 = p0;
        this.p1 = p1;
    },
    draw: function() {
        context.beginPath();
        context.moveTo(this.p0.x, this.p0.y);
        context.lineTo(this.p1.x, this.p1.y);
        context.stroke();
    },
    update: function(p) {
        var dx = this.p1.x - this.p0.x;
        var dy = this.p1.y - this.p0.y;
        var d0 = dx*dx + dy*dy;
        var dd = (p.x - this.p0.x) * dx + (p.y - this.p0.y) * dy;
        if (dd < 0) {
            this.p0 = p;
            this.draw();
        } else if (dd > d0) {
            this.p1 = p;
            this.draw();
        }
    },
    intersect: function(obj) {
        if (obj.type == 'Line') {
            var dx0 = this.p0.x - this.p1.x;
            var dy0 = this.p0.y - this.p1.y;
            var dx1 = obj.p0.x - obj.p1.x;
            var dy1 = obj.p0.y - obj.p1.y;
            var det = dx0 * dy1 - dy0 * dx1;
            if (Math.abs(det) < 1E-6) {
                return [];
            }
            var cross0 = this.p0.x * obj.p1.y - this.p0.y * obj.p1.x;
            var cross1 = obj.p0.x * this.p1.y - obj.p0.y * this.p1.x;
            var x = (cross0 * dx1 - cross1 * dx0) / det;
            var y = (cross0 * dy1 - cross1 * dy0) / det;
            var point = new Point(x, y);
            this.update(point);
            return [point];
        } else {
            var x0 = this.p0.x - obj.x;
            var y0 = this.p0.y - obj.y;
            var x1 = this.p1.x - obj.x;
            var y1 = this.p1.y - obj.y;
            var dx = x1 - x0;
            var dy = y1 - y0;
            var d2 = dx*dx + dy*dy;
            var det = x0*y1 - x1*y0;
            var root = obj.r*obj.r * d2 - det*det;
            if (root < 0) {
                return [];
            }
            var x = obj.x + det*dy/d2;
            var y = obj.y - det*dx/d2;
            if (root < 1E-12) {
                var point = new Point(x, y);
                this.update(point);
                return [point];
            }
            var dxpm = dx/d2 * Math.sqrt(root);
            var dypm = dy/d2 * Math.sqrt(root);
            var pp = new Point(x+dxpm, y+dypm);
            var pm = new Point(x-dxpm, y-dypm);
            this.update(pp);
            this.update(pm);
            return [pm, pp];
        }
    }
});

var Circle = Class ({
    initialize: function(p, r) {
        this.type = 'Circle';
        this.x = p.x;
        this.y = p.y;
        this.r = r;
    },
    draw: function() {
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        context.stroke();
    },
    intersect: function(obj) {
        if (obj.type == 'Line') {
            return obj.intersect(this);
        } else {
            var dx = obj.x - this.x;
            var dy = obj.y - this.y;
            var d = Math.sqrt(dx*dx + dy*dy);
            var xd = (d*d - obj.r*obj.r + this.r*this.r) / (2*d);
            var yd2 = this.r*this.r - xd*xd;
            if (yd2 < 0) {
                return [];
            }
            var yd = Math.sqrt(yd2);
            var x = this.x + xd*dx/d;
            var y = this.y + xd*dy/d;
            if (yd < 1E-3) {
                return [new Point(x, y)];
            }
            var dxpm = +yd*dy/d;
            var dypm = -yd*dx/d;
            return [new Point(x+dxpm, y+dypm), new Point(x-dxpm, y-dypm)];
        }
    }
});

var objects = [];
var points = [];

function new_object(new_obj) {
    for (var i in objects) {
        points.push.apply(points, new_obj.intersect(objects[i]));
    }
    objects.push(new_obj);
}

function add_line(p0, p1) {
    var line = new Line(p0, p1);
    new_object(line);
}

function add_circle(p0, p1) {
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    var r = Math.sqrt(dx*dx + dy*dy);
    var circle = new Circle(p0, r);
    new_object(circle);
}

function init() {
    var p0 = new Point(500, 400);
    var p1 = new Point(700, 400);
    points.push(p0);
    add_line(p0, p1);
    add_circle(p0, p1);
    draw_all();
}

function draw_all() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i in objects) {
        objects[i].draw();
    }
    for (var i in points) {
        points[i].draw();
    }
}

var iptr0 = -1;
var iptr1 = -1;

function mousedown(evt) {
    var x = evt.clientX;
    var y = evt.clientY;
    iptr0 = -1;
    var dist = 0;
    for (var i in points) {
        var new_dist = points[i].distance(x, y);
        if (iptr0 < 0 || new_dist < dist) {
            dist = new_dist;
            iptr0 = i;
        }
    }
}

function mousemove(evt) {
    if (iptr0 >= 0) {
        var x = evt.clientX;
        var y = evt.clientY;
        iptr1 = -1;
        var dist = 0;
        for (var i in points) {
            var new_dist = points[i].distance(x, y);
            if (iptr1 < 0 || new_dist < dist) {
                dist = new_dist;
                iptr1 = i;
            }
        }
        if (iptr1 != iptr0) {
            var p0 = points[iptr0];
            var p1 = points[iptr1];
            var tmp_obj = new Circle(p0, p0.distance(p1.x, p1.y));
            draw_all();
            tmp_obj.draw();
        }
    }
}

function mouseup(evt) {
    if (iptr0 >= 0 && iptr1 >= 0 && iptr1 != iptr0) {
        var p0 = points[iptr0];
        var p1 = points[iptr1];
        add_circle(p0, p1);
        draw_all();
    }
    iptr0 = -1;
    iptr1 = -1;
}

canvas = document.getElementById('ruler-compass-canvas');
canvas.addEventListener('mousedown', mousedown, false);
canvas.addEventListener('mousemove', mousemove, false);
canvas.addEventListener('mouseup', mouseup, false);

context = canvas.getContext('2d');
context.strokeStyle = "#000000";
context.lineWidth = 2;

init();
