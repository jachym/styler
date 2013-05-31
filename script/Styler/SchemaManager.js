Styler.SchemaManager = OpenLayers.Class({
    map: null,
    attributesStores: null,
    matchGeomProperty: /^gml:(Multi)?(Point|LineString|Polygon|Curve|Surface|Geometry)PropertyType$/,
    initialize: function (map) {
        this.map = map;
        this.attributesStores = {};
        var layer;
        for (var i = 0; i < this.map.layers.length; ++i) {
            layer = this.map.layers[i];
            if (layer instanceof OpenLayers.Layer.WMS) {
                this.attributesStores[layer.id] = new Styler.data.AttributesStore({
                    url: OpenLayers.ProxyHost+escape(layer.url.split("?")[0].replace("/wms", "/wfs")+"?service=wfs&version=1.1.1&request=DescribeFeatureType&typename="+layer.params["LAYERS"]),
                    baseParams: {
                        version: "1.1.1",
                        request: "DescribeFeatureType",
                        typename: layer.params["LAYERS"]
                    }
                });
            }
        }
    },
    loadAll: function (callback) {
        var loaders = [];
        for (var id in this.attributesStores) {
            loaders.push(this.createLoader(this.attributesStores[id]));
        }
        Styler.dispatch(loaders, callback);
    },
    createLoader: function (store) {
        return function (done) {
            store.load({
                callback: done
            });
        };
    },
    getGeometryName: function (layer) {
        var store = this.attributesStores[layer.id];
        var index = store.find("type", this.matchGeomProperty);
        var name;
        if (index > -1) {
            name = store.getAt(index).get("name");
        }
        return name;
    },
    getSymbolType: function (layer) {
        var store = this.attributesStores[layer.id];
        var index = store.find("type", this.matchGeomProperty);
        var type;
        if (index > -1) {
            var match = store.getAt(index).get("type").match(this.matchGeomProperty);
            type = ({
                "Point": "Point",
                "LineString": "Line",
                "Polygon": "Polygon",
                "Curve": "Line",
                "Surface": "Polygon"
            })[match[2]];
        }
        return type;
    }
});
