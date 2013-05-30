OpenLayers.Control.WFSGetFeature = OpenLayers.Class(OpenLayers.Control, {
    geometryName: "the_geom",
    multipleKey: null,
    toggleKey: null,
    modifiers: null,
    multiple: false,
    clickout: true,
    hover: false,
    toggle: false,
    box: false,
    clickTolerance: 5,
    maxFeatures: 10,
    wfsVersion: "1.1.0",
    layer: null,
    features: null,
    hoverFeature: null,
    wms2wfsReplace: [/\/wms/, "/wfs"],
    handlerOptions: null,
    handlers: null,
    hoverRequest: null,
    EVENT_TYPES: ["featureselected", "featureunselected", "clickout", "beforefeatureselected", "hoverfeature", "outfeature"],
    initialize: function (layer, options) {
        this.EVENT_TYPES = OpenLayers.Control.WFSGetFeature.prototype.EVENT_TYPES.concat(OpenLayers.Control.prototype.EVENT_TYPES);
        options = options || {};
        options.handlerOptions = options.handlerOptions || {};
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.features = {};
        this.handlers = {
            click: new OpenLayers.Handler.Click(this, {
                click: this.selectSingle
            }, this.handlerOptions.click || {})
        };
        if (this.box) {
            this.handlers.box = new OpenLayers.Handler.Box(this, {
                done: this.selectBox
            }, OpenLayers.Util.extend(this.handlerOptions.box || {}, {
                boxDivClassName: "olHandlerBoxSelectFeature"
            }));
        }
        if (this.hover) {
            this.handlers.hover = new OpenLayers.Handler.Hover(this, {
                'move': this.cancelHover,
                'pause': this.selectHover
            }, OpenLayers.Util.extend(this.handlerOptions.hover || {}, {
                'delay': 250
            }));
        }
    },
    activate: function () {
        if (!this.active) {
            for (var i in this.handlers) {
                this.handlers[i].activate();
            }
        }
        return OpenLayers.Control.prototype.activate.apply(this, arguments);
    },
    deactivate: function () {
        if (this.active) {
            for (var i in this.handlers) {
                this.handlers[i].deactivate();
            }
        }
        return OpenLayers.Control.prototype.deactivate.apply(this, arguments);
    },
    unselectAll: function (options) {
        var feature;
        for (var i = this.features.length - 1; i >= 0; --i) {
            feature = this.features[i];
            if (!options || options.except != feature) {
                this.unselect(feature);
            }
        }
    },
    selectSingle: function (evt) {
        document.body.style.cursor = "wait";
        var bounds = this.pixelToBounds(evt.xy);
        this.setModifiers(evt);
        this.request(bounds, {
            single: true
        });
    },
    selectBox: function (position) {
        if (position instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(position.left, position.bottom));
            var maxXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(position.right, position.top));
            var bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat, maxXY.lon, maxXY.lat);
            this.setModifiers(this.handlers.box.dragHandler.evt);
            this.request(bounds);
            return;
            if (!this.multipleSelect()) {
                this.unselectAll();
            }
            var prevMultiple = this.multiple;
            this.multiple = true;
            for (var i = 0, len = this.layer.features.length; i < len; ++i) {
                var feature = this.layer.features[i];
                if (this.geometryTypes == null || OpenLayers.Util.indexOf(this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                    if (bounds.toGeometry().intersects(feature.geometry)) {
                        if (OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) == -1) {
                            this.select(feature);
                        }
                    }
                }
            }
            this.multiple = prevMultiple;
        }
    },
    selectHover: function (evt) {
        var bounds = this.pixelToBounds(evt.xy);
        this.request(bounds, {
            single: true,
            hover: true
        });
    },
    cancelHover: function () {
        if (this.hoverRequest) {
            this.hoverRequest.abort();
            this.hoverRequest = null;
        }
    },
    request: function (bounds, options) {
        options = options || {};
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.BBOX,
            value: bounds
        });
        var typeName = this.layer.params["LAYERS"].split(":");
        var wfsOptions = {
            url: this.layer.url.replace.apply(this.layer.url, this.wms2wfsReplace),
            featureType: typeName[typeName.length - 1],
            srsName: this.map.getProjectionObject().getCode(),
            geometryName: this.geometryName,
            version: this.wfsVersion
        }
        if (typeName.length > 1) {
            wfsOptions.featurePrefix = typeName[0];
        }
        var wfs = new OpenLayers.Protocol.WFS(wfsOptions);
        var response = wfs.read({
            maxFeatures: this.maxFeatures,
            filter: filter,
            callback: function (result) {
                if (result.code == 1) {
                    if (result.features.length) {
                        if (options.single == true) {
                            this.selectBestFeature(result.features, bounds.getCenterLonLat(), options);
                        } else {
                            this.select(result.features);
                        }
                    } else if (options.hover) {
                        this.hoverSelect();
                    } else {
                        this.events.triggerEvent("clickout");
                        if (this.clickout) {
                            this.unselectAll();
                        }
                    }
                }
                document.body.style.cursor = "default";
            },
            scope: this
        });
        if (options.hover == true) {
            this.hoverRequest = response.priv;
        }
    },
    selectBestFeature: function (features, clickPosition, options) {
        options = options || {};
        if (features.length) {
            var point = new OpenLayers.Geometry.Point(clickPosition.lon, clickPosition.lat);
            var feature, resultFeature, dist;
            var minDist = Number.MAX_VALUE;
            for (var i = 0; i < features.length; ++i) {
                feature = features[i];
                if (feature.geometry) {
                    if (feature.geometry instanceof OpenLayers.Geometry.Point) {
                        dist = feature.geometry.distanceTo(point);
                        if (dist < minDist) {
                            minDist = dist;
                            resultFeature = feature;
                        }
                    } else if (feature.geometry.intersects(point)) {
                        resultFeature = feature;
                        break;
                    } else if (feature.geometry.CLASS_NAME.indexOf("Line") != -1) {
                        resultFeature = feature;
                        break;
                    }
                }
            }
            if (options.hover == true) {
                this.hoverSelect(resultFeature);
            } else {
                this.select(resultFeature || features);
            }
        };
    },
    setModifiers: function (evt) {
        this.modifiers = {
            multiple: this.multiple || evt[this.multipleKey],
            toggle: this.toggle || evt[this.toggleKey]
        }
    },
    select: function (features) {
        if (!this.modifiers.multiple && !this.modifiers.toggle) {
            this.unselectAll();
        }
        if (!(features instanceof Array)) {
            features = [features];
        }
        var feature;
        for (var i = 0; i < features.length; ++i) {
            feature = features[i];
            if (this.features[feature.fid || feature.id]) {
                if (this.modifiers.toggle) {
                    this.unselect(this.features[feature.fid || feature.id]);
                }
            } else {
                cont = this.events.triggerEvent("beforefeatureselected", {
                    feature: feature
                });
                if (cont !== false) {
                    this.features[feature.fid || feature.id] = feature;
                    this.events.triggerEvent("featureselected", {
                        feature: feature
                    });
                }
            }
        }
    },
    hoverSelect: function (feature) {
        var fid = feature ? feature.fid || feature.id : null;
        var hfid = this.hoverFeature ? this.hoverFeature.fid || this.hoverFeature.id : null;
        if (hfid && hfid != fid) {
            this.events.triggerEvent("outfeature", {
                feature: this.hoverFeature
            });
            this.hoverFeature = null;
        }
        if (fid && fid != hfid) {
            this.events.triggerEvent("hoverfeature", {
                feature: feature
            });
            this.hoverFeature = feature;
        }
    },
    unselect: function (feature) {
        delete this.features[feature.fid || feature.id];
        this.events.triggerEvent("featureunselected", {
            feature: feature
        });
    },
    unselectAll: function () {
        for (var fid in this.features) {
            this.unselect(this.features[fid]);
        }
    },
    setMap: function (map) {
        for (var i in this.handlers) {
            this.handlers[i].setMap(map);
        }
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    pixelToBounds: function (pixel) {
        var llPx = pixel.add(-this.clickTolerance / 2, this.clickTolerance / 2);
        var urPx = pixel.add(this.clickTolerance / 2, - this.clickTolerance / 2);
        var ll = this.map.getLonLatFromPixel(llPx);
        var ur = this.map.getLonLatFromPixel(urPx);
        return new OpenLayers.Bounds(ll.lon, ll.lat, ur.lon, ur.lat);
    },
    CLASS_NAME: "OpenLayers.Control.WFSGetFeature"
});
