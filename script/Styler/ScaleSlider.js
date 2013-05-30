Ext.namespace("Styler");
Styler.ScaleSlider = Ext.extend(Ext.Slider, {
    map: null,
    minValue: null,
    maxValue: null,
    updating: false,
    initComponent: function () {
        this.minValue = this.minValue || this.map.getZoomForResolution(this.map.maxResolution || this.map.baseLayer.maxResolution);
        this.maxValue = this.maxValue || this.map.getZoomForResolution(this.map.minResolution || this.map.baseLayer.minResolution);
        Styler.ScaleSlider.superclass.initComponent.call(this);
        this.on({
            "changecomplete": this.changeHandler,
            scope: this
        });
        this.map.events.register("zoomend", this, this.update);
    },
    getZoom: function () {
        return this.getValue();
    },
    getScale: function () {
        return OpenLayers.Util.getScaleFromResolution(this.map.getResolutionForZoom(this.getValue()), this.map.getUnits());
    },
    getResolution: function () {
        return this.map.getResolutionForZoom(this.getValue());
    },
    changeHandler: function () {
        if (!this.updating) {
            this.map.zoomTo(this.getValue());
        }
    },
    update: function () {
        this.updating = true;
        this.setValue(this.map.getZoom());
        this.updating = false;
    },
    addToMap: function (options) {
        options = options || {};
        this.addClass(options.cls || "gx-scaleslider");
        this.render(this.map.viewPortDiv);
        var stopEvent = function (e) {
            e.stopEvent();
        }
        this.getEl().on({
            "mousedown": {
                fn: stopEvent
            },
            "click": {
                fn: stopEvent
            }
        });
    }
});
Ext.reg('gx_scaleslider', Styler.ScaleSlider);
