
Styler.SLDManager = OpenLayers.Class({
    map: null,
    layerData: null,
    initialize: function (map) {
        this.map = map;
        var layer;
        this.layers = [];
        this.layerData = {};
        for (var i = 0; i < this.map.layers.length; ++i) {
            layer = this.map.layers[i];
            if (layer instanceof OpenLayers.Layer.WMS) {
                this.layers.push(layer);
            }
        }
    },
    loadAll: function (callback) {
        var num = this.layers.length;
        var loaders = new Array(num);
        for (var i = 0; i < num; ++i) {
            loaders[i] = this.createLoader(this.layers[i]);
        }
        Styler.dispatch(loaders, callback);
    },
    createLoader: function (layer) {
        return (function (done) {
            this.loadSld(layer, layer.params["STYLES"], done);
        }).createDelegate(this);
    },
    getUrl: function (layer, styleName) {
        var url;
        if (window.LAYMAN_URL) {
                url = LAYMAN_URL+"/geoserver/style/"+styleName;
        }
        else {
            if (layer instanceof OpenLayers.Layer.WMS) {
                url = layer.url.split("?")[0].replace("/wms", "/rest/styles/" + styleName);
            }
        }
        return url;
    },
    loadSld: function (layer, styleName, callback) {

        var success = function (request) {
            var sld = new OpenLayers.Format.SLD().read(request.responseXML.documentElement ? request.responseXML : request.responseText);
            for (var namedLayer in sld.namedLayers) {
                break;
            }
            this.layerData[layer.id] = {
                style: sld.namedLayers[namedLayer].userStyles[0],
                sld: sld,
                styleName: styleName
            };
            callback(this.layerData[layer.id]);
        };

        if (layer.params.SLD_BODY) {
            success({responseText: layer.params.SLD_BODY});
        }
        else {
            OpenLayers.Request.GET({
                url: this.getUrl(layer, styleName) + '.sld',
                success: success, 
                scope: this
            });
        }
    },
    saveSld: function (layer, callback, scope) {
        var sld_body = new OpenLayers.Format.SLD().write(this.layerData[layer.id].sld);
        var layerData = this.layerData;
        OpenLayers.Request.PUT({
            url: this.getUrl(layer, this.layerData[layer.id].styleName),
            headers: {
                'Content-Type': 'application/vnd.ogc.sld+xml'
            },
            data: sld_body,
            scope: scope,
            success: function (request) {
                layer.params.SLD_BODY = undefined;
                callback.call(scope || this, request);
            },
            // sending style to the server has failed,
            // we have to redefine the style and put it to the layer as
            // params.SLD_BODY attribute
            // the for the style (XML) NamedLayer.Name element has to be
            // replaced, based on layer.params.LAYERS
            failure: function(request) {
                var sld = layerData[layer.id].sld;

                for (var namedLayer in sld.namedLayers) {
                    sld.namedLayers[namedLayer].name = layer.params.LAYERS;
                }

                sld_body = new OpenLayers.Format.SLD().write(sld);
                layer.params.SLD_BODY = sld_body;
                callback.call(scope || this, request);
            }
        });
    },
    getStyle: function (layer) {
        var data = this.layerData[layer.id];
        return data && data.style;
    }
});
