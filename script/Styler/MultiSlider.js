Ext.namespace("Styler");
Styler.MultiSlider = Ext.extend(Ext.BoxComponent, {
    count: 2,
    vertical: false,
    minValue: 0,
    maxValue: 100,
    increment: 0,
    clickRange: [5, 15],
    clickToChange: true,
    animate: true,
    dragging: false,
    initComponent: function () {
        if (this.values === undefined) {
            this.values = new Array(this.count);
            this.values[0] = this.minValue;
            if (this.count > 1) {
                var delta = (this.maxValue - this.minValue) / (this.count - 1);
                for (var i = 1; i < this.count; ++i) {
                    this.values[i] = this.minValue + (i * delta);
                }
            }
        } else {
            this.count = this.values.length;
        }
        Styler.MultiSlider.superclass.initComponent.call(this);
        this.addEvents('beforechange', 'change', 'changecomplete', 'dragstart', 'drag', 'dragend');
        if (this.vertical) {
            Ext.apply(this, Styler.MultiSlider.Vertical);
        }
    },
    onRender: function () {
        var autoThumbs = new Array(this.count);
        for (var i = 0; i < this.count; ++i) {
            autoThumbs[i] = {
                cls: "x-slider-thumb " + "x-slider-thumb" + i
            };
        }
        this.autoEl = {
            cls: 'x-slider ' + (this.vertical ? 'x-slider-vert' : 'x-slider-horz'),
            cn: {
                cls: 'x-slider-end',
                cn: {
                    cls: 'x-slider-inner',
                    cn: autoThumbs
                }
            }
        };
        Styler.MultiSlider.superclass.onRender.apply(this, arguments);
        this.endEl = this.el.first();
        this.innerEl = this.endEl.first();
        this.thumbs = new Array(this.count);
        for (var i = 0; i < this.count; ++i) {
            this.thumbs[i] = new Ext.Element(this.innerEl.dom.childNodes[i]);
        }
        this.halfThumb = (this.vertical ? this.thumbs[0].getHeight() : this.thumbs[0].getWidth()) / 2;
        this.initEvents();
    },
    initEvents: function () {
        for (var i = 0, len = this.thumbs.length; i < len; ++i) {
            this.thumbs[i].addClassOnOver('x-slider-thumb-over');
        }
        this.mon(this.el, 'mousedown', this.onMouseDown, this);
        this.trackers = new Array(this.count);
        for (var i = 0; i < this.count; ++i) {
            this.trackers[i] = this.initTracker(i);
        }
    },
    initTracker: function (index) {
        var tracker = new Ext.dd.DragTracker({
            onBeforeStart: this.onBeforeDragStart.createDelegate(this, [index], true),
            onStart: this.onDragStart.createDelegate(this, [index], true),
            onDrag: this.onDrag.createDelegate(this, [index], true),
            onEnd: this.onDragEnd.createDelegate(this, [index], true),
            tolerance: 3,
            autoStart: 300
        });
        tracker.initEl(this.thumbs[index]);
        this.on('beforedestroy', tracker.destroy, tracker);
        return tracker;
    },
    onMouseDown: function (e) {
        if (this.disabled || !this.clickToChange) {
            return;
        }
        var over = false;
        for (var i = 0; i < this.count; ++i) {
            over = over || e.target == this.thumbs[i].dom;
        }
        if (!over) {
            var local = this.innerEl.translatePoints(e.getXY());
            this.onClickChange(local);
        }
    },
    onClickChange: function (local) {
        if (local.top > this.clickRange[0] && local.top < this.clickRange[1]) {
            var target = Math.round(this.reverseValue(local.left));
            var index = this.getClosestIndex(target);
            var values = this.values.slice();
            values[index] = target;
            this.setValues(values, undefined, true);
        }
    },
    getClosestIndex: function (target) {
        var index = 0;
        var value = this.values[0];
        var minDiff = Math.abs(target - value);
        var diff;
        if (this.count > 1 && (target >= value)) {
            for (var i = 1; i < this.count; ++i) {
                value = this.values[i];
                diff = Math.abs(target - value);
                if (diff <= minDiff) {
                    if (diff == minDiff) {
                        if (target > value) {
                            index = i;
                        }
                    } else {
                        index = i;
                        minDiff = diff;
                    }
                } else {
                    break;
                }
            }
        }
        return index;
    },
    doSnap: function (value) {
        if (!this.increment || this.increment == 1 || !value) {
            return value;
        }
        var newValue = value,
            inc = this.increment;
        var m = value % inc;
        if (m > 0) {
            if (m > (inc / 2)) {
                newValue = value + (inc - m);
            } else {
                newValue = value - m;
            }
        }
        return newValue.constrain(this.minValue, this.maxValue);
    },
    afterRender: function () {
        Styler.MultiSlider.superclass.afterRender.apply(this, arguments);
        if (this.values !== undefined) {
            var v, value, changed;
            var newValues = this.values.slice();
            for (var i = 0; i < this.count; ++i) {
                value = newValues[i];
                v = this.normalizeValue(value);
                if (v !== value) {
                    newValues[i] = v;
                    changed = true;
                }
            }
            if (changed) {
                this.setValues(newValues, false);
            } else {
                this.moveThumbs(this.translateValues(this.values), false);
            }
        }
    },
    getRatio: function () {
        var w = this.innerEl.getWidth();
        var v = this.maxValue - this.minValue;
        return v == 0 ? w : (w / v);
    },
    normalizeValue: function (v) {
        if (typeof v != 'number') {
            v = parseInt(v);
        }
        v = Math.round(v);
        v = this.doSnap(v);
        v = v.constrain(this.minValue, this.maxValue);
        return v;
    },
    setValues: function (values, animate, changeComplete) {
        var changed = false;
        for (var i = 0; i < this.count; ++i) {
            values[i] = this.normalizeValue(values[i]);
            if (values[i] !== this.values[i]) {
                changed = true;
            }
        }
        var changed = (values[this.count - 1] !== this.values[this.count - 1]);
        if (this.count > 1) {
            var next, current;
            for (var i = this.count - 2; i >= 0; --i) {
                next = values[i + 1];
                current = values[i];
                if (current > next) {
                    values[i] = next;
                }
                changed = changed || (values[i] !== this.values);
            }
        }
        if (changed && this.fireEvent('beforechange', this, values, this.values) !== false) {
            this.values = values;
            this.moveThumbs(this.translateValues(values), animate !== false);
            this.fireEvent('change', this, values);
            if (changeComplete) {
                this.fireEvent('changecomplete', this, values);
            }
        }
    },
    translateValues: function (values) {
        var ratio = this.getRatio();
        var len = values.length;
        var newValues = new Array(len);
        for (var i = 0; i < len; ++i) {
            newValues[i] = (values[i] * ratio) - (this.minValue * ratio) - this.halfThumb;
        }
        return newValues;
    },
    reverseValue: function (pos) {
        var ratio = this.getRatio();
        return (pos + this.halfThumb + (this.minValue * ratio)) / ratio;
    },
    moveThumbs: function (values, animate) {
        if (!animate || this.animate === false) {
            for (var i = 0; i < this.count; ++i) {
                this.thumbs[i].setLeft(values[i]);
            }
        } else {
            for (var i = 0; i < this.count; ++i) {
                this.thumbs[i].shift({
                    left: values[i],
                    stopFx: true,
                    duration: .35
                });
            }
        }
    },
    onBeforeDragStart: function (e, index) {
        return !this.disabled;
    },
    onDragStart: function (e, index) {
        this.thumbs[index].addClass('x-slider-thumb-drag');
        this.dragging = true;
        this.dragStartValue = this.values[index];
        this.fireEvent('dragstart', this, index, e);
    },
    onDrag: function (e, index) {
        var pos = this.innerEl.translatePoints(this.trackers[index].getXY());
        var newValues = this.values.slice();
        newValues[index] = Math.round(this.reverseValue(pos.left));
        this.setValues(newValues, false);
        this.fireEvent('drag', this, index, e);
    },
    onDragEnd: function (e, index) {
        this.thumbs[index].removeClass('x-slider-thumb-drag');
        this.dragging = false;
        this.fireEvent('dragend', this, index, e);
        if (this.dragStartValue != this.values[index]) {
            this.fireEvent('changecomplete', this, this.values);
        }
    },
    onResize: function (w, h) {
        this.innerEl.setWidth(w - (this.el.getPadding('l') + this.endEl.getPadding('r')));
        this.syncThumbs();
    },
    syncThumbs: function () {
        if (this.rendered) {
            this.moveThumbs(this.translateValues(this.values));
        }
    },
    getValues: function () {
        return this.values;
    }
});
Ext.reg('gx_multislider', Styler.MultiSlider);

Styler.MultiSlider.Vertical = {
    onResize: function (w, h) {
        this.innerEl.setHeight(h - (this.el.getPadding('t') + this.endEl.getPadding('b')));
        this.syncThumbs();
    },
    getRatio: function () {
        var h = this.innerEl.getHeight();
        var v = this.maxValue - this.minValue;
        return h / v;
    },
    moveThumbs: function (values, animate) {
        if (!animate || this.animate === false) {
            for (var i = 0; i < this.count; ++i) {
                this.thumbs[i].setBottom(values[i]);
            }
        } else {
            for (var i = 0; i < this.count; ++i) {
                this.thumbs[i].shift({
                    bottom: values[i],
                    stopFx: true,
                    duration: .35
                });
            }
        }
    },
    onDrag: function (e, index) {
        var pos = this.innerEl.translatePoints(this.trackers[index].getXY());
        var bottom = this.innerEl.getHeight() - pos.top;
        var newValues = this.values.slice();
        newValues[index] = Math.round(bottom / this.getRatio());
        this.setValues(newValues, false);
        this.fireEvent('drag', this, index, e);
    },
    onClickChange: function (local) {
        if (local.left > this.clickRange[0] && local.left < this.clickRange[1]) {
            var bottom = this.innerEl.getHeight() - local.top;
            var target = Math.round(bottom / this.getRatio());
            var index = this.getClosestIndex(target);
            var values = this.values.slice();
            values[index] = target;
            this.setValues(values, undefined, true);
        }
    }
};
