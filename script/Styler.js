var OWS_URL = "http://88.86.113.236/geoserver/ows?";

var Styler = function () {





    this.addEvents("initialized","layerchanged", "ruleadded", "ruleremoved", "ruleupdated");

    var params = OpenLayers.Util.getParameters();
    
    if(params.wms) {
        OWS_URL = params.wms;
    }

    Styler.dispatch([function (done) {
        Ext.onReady(function () {
            this.createLayout();
            done();
        }, this);
    }, function (done) {
        this.getCapabilities(done);
    }], function () {
        this.createLayers();
        this.getSchemas(this.initEditor.createDelegate(this));
        this.fireEvent("initialized");
    }, this);

};

Ext.extend(Styler, Ext.util.Observable, {
    map: null,
    wmsLayerList: null,
    wfsLayerList: null,
    layerList: null,
    currentLayer: null,
    sldManager: null,
    schemaManager: null,
    symbolTypes: null,
    ruleDlg: null,
    featureDlg: null,
    getFeatureControl: null,
    saving: null,
    windowPositions: {
        featureDlg: {},
        ruleDlg: {}
    },
    getCapabilities: function (callback) {
        Styler.dispatch([function (done) {
            this.getWMSCapabilities(done);
        }, function (done) {
            this.getWFSCapabilities(done);
        }], function () {
            this.mergeCapabilities();
            callback();
        }, this);
    },
    getWMSCapabilities: function (callback) {
        var r = OpenLayers.Request.GET({
            url: OWS_URL,
            success: this.parseWMSCapabilities,
            failure: function () {
                throw ("Unable to read capabilities from WMS");
            },
            params: {
                SERVICE: "WMS",
                VERSION: "1.1.1",
                REQUEST: "GetCapabilities"
            },
            scope:this
        });
        r.callback =  callback;
    },
    getWFSCapabilities: function (callback) {
        var r = OpenLayers.Request.GET({
            url: OWS_URL,
            success: this.parseWFSCapabilities,
            failure: function () {
                throw ("Unable to read capabilities from WMS");
            },
            params: {
                SERVICE: "WFS",
                VERSION: "1.1.0",
                REQUEST: "GetCapabilities"
            },
            scope:this
        });
        r.callback =  callback;
    },
    parseWMSCapabilities: function (response) {


        var capabilities = new OpenLayers.Format.WMSCapabilities().read(Styler.getContent(response));
        this.wmsLayerList = capabilities.capability.layers;
        response.callback();
    },
    parseWFSCapabilities: function (response ) {
        var format = new OpenLayers.Format.WFSCapabilities();
        var content = Styler.getContent(response);
        var capabilities = format.read(content);
        this.wfsLayerList = capabilities.featureTypeList.featureTypes;
        response.callback();
    },
    mergeCapabilities: function () {
        this.layerList = [];
        var layer, name;
        for (var i = 0; i < this.wmsLayerList.length; ++i) {
            layer = this.wmsLayerList[i];
            name = layer.name;
            for (var j = 0; j < this.wfsLayerList.length; ++j) {

                var wfsLayer = this.wfsLayerList[j];
                var wfsName = wfsLayer.name;
                //if (wfsLayer.featureNS) {
                //    wfsName = wfsLayer.featureNS+":"+wfsLayer.name;
                //}
                if (wfsName === name) {
                    this.layerList.push(layer);
                    break;
                }
            }
        }
    },
    createLayout: function () {
        this.getFeatureControl = new OpenLayers.Control.WFSGetFeature();
        this.getFeatureControl.events.on({
            "featureselected": function (e) {
                this.showFeatureInfo(this.currentLayer, e.feature);
            },
            scope: this
        });
        this.mapPanel = new GeoExt.widgets.map.MapPanel({
            border: true,
            region: "center",
            mapOptions: {
                controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.PanPanel()],
                projection: new OpenLayers.Projection("EPSG:900913"),
                units: "m",
                theme: null,
                maxResolution: 156543.0339,
                maxExtent: new OpenLayers.Bounds(-20037508.34, - 20037508.34, 20037508.34, 20037508.34)
            },
            controls: [this.getFeatureControl]
        });
        this.legendContainer = new Ext.Panel({
            title: "Legend",
            height: 200,
            items: [{
                html: ""
            }],
            bbar: [{
                text: "Add new",
                iconCls: "add",
                disabled: true,
                handler: function () {
                    var panel = this.getLegend();
                    var symbolizer = {};
                    symbolizer[panel.symbolType] = OpenLayers.Format.SLD.v1.prototype.defaultSymbolizer;
                    var rule = new OpenLayers.Rule({
                        symbolizer: symbolizer
                    });
                    panel.rules.push(rule);
                    this.fireEvent("ruleadded", rule);
                    this.showRule(this.currentLayer, rule, panel.symbolType, function () {
                        if (!this.saving) {
                            panel.rules.remove(rule);
                            this.fireEvent("ruleremoved", rule);
                        }
                    });
                },
                scope: this
            }, {
                text: "Delete selected",
                iconCls: "delete",
                disabled: true,
                handler: function () {
                    var panel = this.getLegend();
                    var rule = panel.selectedRule;
                    var message = "Are you sure you want to delete the " + panel.getRuleTitle(rule) + " rule?";
                    Ext.Msg.confirm("Delete rule", message, function (yesno) {
                        if (yesno == "yes") {
                            panel.rules.remove(rule);
                            this.fireEvent("ruleremoved", rule);
                            sldMgr = this.sldManager;
                            sldMgr.saveSld(this.currentLayer, function () {
                                this.ruleDlg.close();
                                this.repaint();
                            }, this);
                        }
                    }, this);
                },
                scope: this
            }]
        });
        this.layersContainer = new Ext.Panel({
            autoScroll: true,
            title: "Layers",
            anchor: "100%, -200"
        });
        var westPanel = new Ext.Panel({
            border: true,
            layout: "anchor",
            region: "west",
            width: 250,
            split: true,
            collapsible: true,
            collapseMode: "mini",
            items: [this.layersContainer, this.legendContainer]
        });
        var viewport = new Ext.Viewport({
            layout: "fit",
            hideBorders: true,
            items: {
                layout: "border",
                deferredRender: false,
                items: [
                    new Ext.BoxComponent(
                    {
                        heigth: 50,
                        el: "superhead",
                        region: "north"
                    }),
                    this.mapPanel, westPanel]
            }
        });
        this.map = this.mapPanel.map;
    },
    createLayers: function () {
        var layerList = this.layerList;
        var num = layerList.length;
        var layers = new Array(num + 1);
        var map = this.map;
        layers[0] = new OpenLayers.Layer.OSM("OSM");
        for (var i = 0; i < num; ++i) {
            var maxExtent = new OpenLayers.Bounds(layerList[i].llbbox[0], layerList[i].llbbox[1], layerList[i].llbbox[2], layerList[i].llbbox[3]).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
            maxExtent.left = (maxExtent.left < map.maxExtent.left ? map.maxExtent.left : maxExtent.left);
            maxExtent.right = (maxExtent.right < map.maxExtent.right ? map.maxExtent.right : maxExtent.right);
            maxExtent.bottom = (maxExtent.bottom > map.maxExtent.bottom ? map.maxExtent.bottom : maxExtent.bottom);
            maxExtent.top = (maxExtent.top > map.maxExtent.top ? map.maxExtent.top : maxExtent.top);
            layers[i + 1] = new OpenLayers.Layer.WMS(layerList[i].title, OWS_URL, {
                layers: layerList[i].name,
                styles: layerList[i].styles[0].name,
                transparent: "true",
                tileOrigin: [layerList[i].llbbox[0], layerList[i].llbbox[1]],
                format: OpenLayers.Util.alphaHack() ? "image/gif" : "image/png"
            }, {
                isBaseLayer: false,
                displayOutsideMaxExtent: true,
                visibility: false,
                maxExtent: maxExtent
            });
        }
        this.layerTree = new Ext.tree.TreePanel({
            border: false,
            loader: new Ext.tree.TreeLoader({
                clearOnLoad: true
            }),
            root: {
                nodeType: "async",
                children: [{
                    nodeType: "olOverlayLayerContainer",
                    text: "Layers",
                    expanded: true
                }]
            },
            rootVisible: false,
            lines: false,
            listeners: {
                "checkchange": this.changeLayer,
                scope: this
            }
        });
        this.layersContainer.add(this.layerTree);
        this.layersContainer.doLayout();
        this.map.addLayers(layers);
        var slider = new Styler.ScaleSlider({
            plugins: new Styler.ScaleSliderTip(),
            vertical: true,
            height: 120,
            map: this.map
        }).addToMap();
        this.setCurrentLayer(this.map.layers[1]);
    },
    getSchemas: function (callback) {
        this.schemaManager = new Styler.SchemaManager(this.map);
        this.schemaManager.loadAll(callback);
    },
    getStyles: function (callback) {
        this.sldManager = new Styler.SLDManager(this.map);
        this.sldManager.loadAll(callback);
    },
    initEditor: function () {
        this.symbolTypes = {};
        this.sldManager = new Styler.SLDManager(this.map);
        this.getFeatureControl.activate();
        this.setCurrentLayer(this.currentLayer);
        this.on({
            "ruleadded": function () {
                this.refreshLegend();
                this.refreshFeatureDlg();
            },
            "ruleremoved": function () {
                this.refreshLegend();
                this.refreshFeatureDlg();
            },
            "ruleupdated": function () {
                this.refreshLegend();
                this.refreshFeatureDlg();
            },
            "layerchanged": function (layer) {
                this.showLegend(layer);
            },
            scope: this
        });
        this.showLegend(this.currentLayer);
    },
    changeLayer: function (node, checked) {
        if (checked === true && this.currentLayer != node.layer) {
            this.setCurrentLayer(node.layer);
        }
    },
    setCurrentLayer: function (layer) {
        if (layer != this.currentLayer) {
            if (this.currentLayer) {
                this.currentLayer.setVisibility(false);
            }
            this.map.zoomToExtent(layer.maxExtent);
            this.currentLayer = layer;
            if (this.ruleDlg) {
                this.ruleDlg.destroy();
                delete this.ruleDlg;
            }
            if (this.featureDlg) {
                this.featureDlg.destroy();
                delete this.featureDlg;
            }
            this.fireEvent("layerchanged", this.currentLayer);
        }
        if (layer.getVisibility() === false) {
            layer.setVisibility(true);
        }
        if (this.getFeatureControl.active) {
            this.getFeatureControl.layer = layer;
            this.getFeatureControl.geometryName = this.schemaManager.getGeometryName(layer);
        }
    },
    getRules: function (layer, callback) {
        var rules;
        var style = this.sldManager.getStyle(layer);
        if (style) {
            callback.call(this, style.rules);
        } else {
            this.sldManager.loadSld(layer, layer.params["STYLES"], function (result) {
                callback.call(this, result.style.rules);
            }.createDelegate(this));
        }
    },
    showLegend: function (layer) {
        var old = this.legendContainer.items.length && this.legendContainer.getComponent(0);
        if (old) {
            this.getAddButton().disable();
            this.legendContainer.remove(old);
        }
        Styler.dispatch([function (done, context) {
            this.getSymbolType(layer, function (type) {
                context.symbolType = type;
                done();
            });
        }, function (done, context) {
            this.getRules(layer, function (rules) {
                context.rules = rules;
                done();
            });
        }], function (context) {
            if (layer === this.currentLayer) {
                this.addLegend(layer, context.rules, context.symbolType);
            }
        }, this);
    },
    addLegend: function (layer, rules, type) {
        var deleteButton = this.getDeleteButton();
        var legend = new Styler.LegendPanel({
            rules: rules,
            symbolType: type,
            border: false,
            style: {
                padding: "10px"
            },
            selectOnClick: true,
            listeners: {
                "ruleselected": function (panel, rule) {
                    this.showRule(this.currentLayer, rule, panel.symbolType);
                    deleteButton.enable();
                },
                "ruleunselected": function (panel, rule) {
                    deleteButton.disable();
                },
                "rulemoved": function (panel, rule) {
                    legend.disable();
                    this.sldManager.saveSld(this.currentLayer, function () {
                        legend.enable();
                        this.repaint();
                    }, this);
                },
                scope: this
            }
        });
        this.legendContainer.add(legend);
        this.legendContainer.doLayout();
        this.getAddButton().enable();
    },
    refreshLegend: function () {
        var legend = this.legendContainer.items.length && this.legendContainer.getComponent(0);
        if (legend) {
            legend.update();
        }
    },
    refreshFeatureDlg: function () {
        if (this.featureDlg && !this.featureDlg.hidden) {
            var feature = this.featureDlg.getFeature();
            this.showFeatureInfo(this.currentLayer, feature);
        }
    },
    setSymbolType: function (layer, type) {
        this.symbolTypes[layer.id] = type;
        return type;
    },
    getSymbolTypeFromFeature: function (feature) {
        return feature.geometry.CLASS_NAME.replace(/OpenLayers\.Geometry\.(Multi)?|String/g, "");
    },
    getSymbolType: function (layer, callback) {
        var type = this.symbolTypes[layer.id];
        if (type) {
            callback.call(this, type);
        } else {
            type = this.schemaManager.getSymbolType(layer);
            if (type) {
                this.setSymbolType(layer, type);
                callback.call(this, type);
            } else {
                this.getOneFeature(layer, function (features) {
                    type = this.setSymbolType(layer, this.getSymbolTypeFromFeature(features[0]));
                    callback.call(this, type);
                });
            }
        }
    },
    showFeatureInfo: function (layer, feature) {
        if (this.featureDlg) {
            this.featureDlg.destroy();
        }
        this.getRules(layer, function (rules) {
            this.displayFeatureDlg(layer, feature, rules);
        });
    },
    displayFeatureDlg: function (layer, feature, rules) {
        feature.layer = layer;
        var matchingRules = [];
        var rule;
        for (var i = 0; i < rules.length; ++i) {
            rule = rules[i];
            if (rule.evaluate(feature)) {
                matchingRules.push(rule);
            }
        }
        this.featureDlg = new Ext.Window({
            title: "Feature: " + feature.fid || feature.id,
            layout: "fit",
            resizable: false,
            width: 220,
            x: this.windowPositions.featureDlg.x,
            y: this.windowPositions.featureDlg.y,
            items: [{
                hideBorders: true,
                border: false,
                autoHeight: true,
                items: [{
                    xtype: "gx_legendpanel",
                    title: "Rules used to render this feature:",
                    bodyStyle: {
                        paddingLeft: "5px"
                    },
                    symbolType: this.getSymbolTypeFromFeature(feature),
                    rules: matchingRules,
                    clickableSymbol: true,
                    listeners: {
                        "symbolclick": function (panel, rule) {
                            this.showRule(this.currentLayer, rule, panel.symbolType);
                        },
                        scope: this
                    }
                }, {
                    xtype: "propertygrid",
                    title: "Attributes of this feature:",
                    height: 120,
                    source: feature.attributes,
                    autoScroll: true,
                    listeners: {
                        "beforepropertychange": function () {
                            return false;
                        }
                    }
                }]
            }],
            listeners: {
                "move": function (cp, x, y) {
                    this.windowPositions["featureDlg"] = {
                        x: x,
                        y: y
                    };
                },
                scope: this
            },
            getFeature: function () {
                return feature
            }
        });
        this.featureDlg.show();
    },
    showRule: function (layer, rule, symbolType, closeCallback) {
        var newRule = rule.clone();
        if (this.ruleDlg) {
            this.ruleDlg.destroy();
        }

        this.ruleDlg = new Ext.Window({
            title: "Style: " + (rule.title || rule.name || "Untitled"),
            layout: "fit",
            x: this.windowPositions.ruleDlg.x,
            y: this.windowPositions.ruleDlg.y,
            width: 265,
            constrainHeader: true,
            items: [{
                xtype: "gx_rulepanel",
                autoHeight: false,
                autoScroll: true,
                rule: newRule,
                symbolType: Styler.Util.getSymbolTypeFromRule(rule),
                nestedFilters: false,
                scaleLevels: this.map.baseLayer.numZoomLevels,
                minScaleLimit: OpenLayers.Util.getScaleFromResolution(this.map.baseLayer.resolutions[this.map.baseLayer.numZoomLevels - 1], this.map.units),
                maxScaleLimit: OpenLayers.Util.getScaleFromResolution(this.map.baseLayer.resolutions[0], this.map.units),
                scaleSliderTemplate: "<div>{zoomType} Zoom Level: {zoom}</div>" + "<div>Current Map Zoom: {mapZoom}</div>",
                modifyScaleTipContext: (function (panel, data) {
                    data.mapZoom = this.map.getZoom();
                }).createDelegate(this),

                attributes: new Styler.data.AttributesStore({
                    url: OpenLayers.Request.makeSameOrigin(
                             OpenLayers.Util.urlAppend(OWS_URL,"service=wfs&version=1.1.1&request=DescribeFeatureType&typename="+layer.params["LAYERS"]),OpenLayers.ProxyHost),
                    //baseParams: {
                    //    version: "1.1.1",
                    //    request: "DescribeFeatureType",
                    //    typename: layer.params["LAYERS"]
                    //},
                    ignore: {
                        name: this.schemaManager.getGeometryName(layer)
                    }
                }),

                pointGraphics: [{
                    display: "circle",
                    value: "circle",
                    mark: true,
                    preview: "theme/img/circle.gif"
                }, {
                    display: "square",
                    value: "square",
                    mark: true,
                    preview: "theme/img/square.gif"
                }, {
                    display: "triangle",
                    value: "triangle",
                    mark: true,
                    preview: "theme/img/triangle.gif"
                }, {
                    display: "star",
                    value: "star",
                    mark: true,
                    preview: "theme/img/star.gif"
                }, {
                    display: "cross",
                    value: "cross",
                    mark: true,
                    preview: "theme/img/cross.gif"
                }, {
                    display: "x",
                    value: "x",
                    mark: true,
                    preview: "theme/img/x.gif"
                }, {
                    display: "custom..."
                }]
            }],
            bbar: ["->", {
                text: "cancel",
                iconCls: "cancel",
                handler: function () {
                    this.ruleDlg.close();
                },
                scope: this
            }, {
                text: "save",
                iconCls: "save",
                handler: function () {
                    this.saving = true;
                    this.ruleDlg.disable();
                    this.updateRule(rule, newRule);
                    this.sldManager.saveSld(layer, function () {
                        this.ruleDlg.close();
                        this.repaint();
                        this.saving = false;
                    }, this);
                },
                scope: this
            }],
            listeners: {
                close: function () {
                    this.getLegend().unselect();
                    if (closeCallback) {
                        closeCallback.call(this);
                    }
                },
                move: function (cp, x, y) {
                    this.windowPositions["ruleDlg"] = {
                        x: x,
                        y: y
                    };
                },
                scope: this
            }
        });
        this.ruleDlg.show();
    },
    updateRule: function (rule, newRule) {
        rule.title = newRule.title;
        rule.symbolizer = newRule.symbolizer;
        rule.filter = newRule.filter;
        rule.minScaleDenominator = newRule.minScaleDenominator;
        rule.maxScaleDenominator = newRule.maxScaleDenominator;
        this.fireEvent("ruleupdated", rule);
    },
    repaint: function () {
        this.currentLayer.redraw(true);
    },
    getOneFeature: function (layer, callback) {

        OpenLayers.Request.GET({
            url: OWS_URL,
            success: function (response) {
                var features = new OpenLayers.Format.GML().read(Styler.getContent(response));
                if (features.length) {
                    callback.call(this, features);
                } else {
                    throw ("Could not load features from the WFS");
                }
            },
            failure: function (response) {
                throw ("Could not load features from the WFS");
            },
            complete: callback,
            params: {
                version: "1.0.0",
                SERVICE: "WFS",
                request: "GetFeature",
                typeName: layer.params["LAYERS"],
                maxFeatures: "1"
            },
            scope:this
        });
    },
    getLegend: function () {
        return this.legendContainer.getComponent(0);
    },
    getAddButton: function () {
        return this.legendContainer.getBottomToolbar().items.get(0);
    },
    getDeleteButton: function () {
        return this.legendContainer.getBottomToolbar().items.get(1);
    }
});

OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
OpenLayers.ProxyHost = "/cgi-bin/hsproxy.cgi?url=";


Ext.namespace("Styler");

Styler.dispatch = function (functions, complete, scope) {
    var requests = functions.length;
    var responses = 0;
    var storage = {};

    function respond() {
        ++responses;
        if (responses === requests) {
            complete.call(scope, storage);
        }
    }

    function trigger(index) {
        window.setTimeout(function () {
            functions[index].apply(scope, [respond, storage]);
        });
    }
    for (var i = 0; i < requests; ++i) {
        trigger(i);
    }
};


Styler.getContent = function(response) {
        var content;
        // God mess IE
        if(false && Ext.isIE) {
            content=response.responseText;
            var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            // required or IE will attempt to validate against DTD, which could fail
            // because the dtd is not accessibile and we don't really care
            // we will notice later if any layer was loaded from the response anyway
            xmlDoc.async = false;
            xmlDoc.validateOnParse = false;
            xmlDoc.resolveExternals = false;
            var parsed=xmlDoc.loadXML(content);
            if(!parsed) {
                var myErr = xmlDoc.parseError;
                alert(myErr.reason);
            } else {
                content=xmlDoc;
            }
        }
        else {
            content = response.responseXML ? response.responseXML : response.responseText;
        }

        return content;
};
