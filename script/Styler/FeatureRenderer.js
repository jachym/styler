Ext.namespace("Styler");
Styler.FeatureRenderer = Ext.extend(Ext.BoxComponent, {
    feature: undefined,
    symbolizer: OpenLayers.Feature.Vector.style["default"],
    symbolType: "Point",
    resolution: 1,
    minWidth: 20,
    minHeight: 20,
    renderers: ['SVG', 'VML', 'Canvas'],
    rendererOptions: null,
    pointFeature: undefined,
    lineFeature: undefined,
    polygonFeature: undefined,
    renderer: null,
    initComponent: function () {
        Styler.FeatureRenderer.superclass.initComponent.call(this);
        Ext.applyIf(this, {
            pointFeature: new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0, 0)),
            lineFeature: new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(-8, - 3), new OpenLayers.Geometry.Point(-3, 3), new OpenLayers.Geometry.Point(3, - 3), new OpenLayers.Geometry.Point(8, 3)])),
            polygonFeature: new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing([new OpenLayers.Geometry.Point(-8, - 4), new OpenLayers.Geometry.Point(-6, - 6), new OpenLayers.Geometry.Point(6, - 6), new OpenLayers.Geometry.Point(8, - 4), new OpenLayers.Geometry.Point(8, 4), new OpenLayers.Geometry.Point(6, 6), new OpenLayers.Geometry.Point(-6, 6), new OpenLayers.Geometry.Point(-8, 4)])]))
        });
        if (!this.feature) {
            this.setFeature(null, {
                draw: false
            });
        }
        this.addEvents("click");
    },
    initClickEvents: function () {
        this.el.removeAllListeners();
        this.el.on("click", this.onClick, this);
    },
    onClick: function () {
        this.fireEvent("click", this);
    },
    onRender: function (ct, position) {
        if (!this.el) {
            this.el = document.createElement("div");
            this.el.id = this.getId();
        }
        if (!this.renderer || !this.renderer.supported()) {
            this.assignRenderer();
        }
        this.renderer.map = {
            getResolution: (function () {
                return this.resolution;
            }).createDelegate(this)
        };
        this.drawFeature();
        Styler.FeatureRenderer.superclass.onRender.call(this, ct, position);
    },
    afterRender: function () {
        Styler.FeatureRenderer.superclass.afterRender.call(this);
        this.initClickEvents();
    },
    onResize: function (w, h) {
        this.setRendererDimensions();
        Styler.FeatureRenderer.superclass.onResize.call(this, w, h);
    },
    setRendererDimensions: function () {
        var gb = this.feature.geometry.getBounds();
        var gw = gb.getWidth();
        var gh = gb.getHeight();
        var resolution = this.initialConfig.resolution;
        if (!resolution) {
            resolution = Math.max(gw / this.width || 0, gh / this.height || 0) || 1;
        }
        this.resolution = resolution;
        var width = Math.max(this.width || this.minWidth, gw / resolution);
        var height = Math.max(this.height || this.minHeight, gh / resolution);
        var center = gb.getCenterPixel();
        var bhalfw = width * resolution / 2;
        var bhalfh = height * resolution / 2;
        var bounds = new OpenLayers.Bounds(center.x - bhalfw, center.y - bhalfh, center.x + bhalfw, center.y + bhalfh);
        this.renderer.setSize(new OpenLayers.Size(Math.round(width), Math.round(height)));
        this.renderer.setExtent(bounds, true);
    },
    assignRenderer: function () {
        for (var i = 0, len = this.renderers.length; i < len; ++i) {
            var rendererClass = OpenLayers.Renderer[this.renderers[i]];
            if (rendererClass && rendererClass.prototype.supported()) {
                this.renderer = new rendererClass(this.el, this.rendererOptions);
                break;
            }
        }
    },
    setSymbolizer: function (symbolizer, options) {
        this.symbolizer = symbolizer;
        if (this.rendered && (!options || options.draw)) {
            this.drawFeature();
        }
    },
    setGeometryType: function (type, options) {
        this.symbolType = type;
        this.setFeature(null, options);
    },
    setFeature: function (feature, options) {
        this.feature = feature || this[this.symbolType.toLowerCase() + "Feature"];
        if (!options || options.draw) {
            this.drawFeature();
        }
    },
    drawFeature: function () {
        this.renderer.clear();
        this.setRendererDimensions();
        this.renderer.drawFeature(this.feature, Ext.apply({}, this.symbolizer));
    },
    update: function (options) {
        options = options || {};
        if (options.feature) {
            this.setFeature(options.feature, {
                draw: false
            });
        } else if (options.symbolType) {
            this.setGeometryType(options.symbolType, {
                draw: false
            });
        }
        if (options.symbolizer) {
            this.setSymbolizer(options.symbolizer, {
                draw: false
            });
        }
        this.drawFeature();
    }
});
Ext.reg('gx_renderer', Styler.FeatureRenderer);
