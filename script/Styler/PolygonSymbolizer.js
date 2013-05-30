Ext.namespace("Styler");
Styler.PolygonSymbolizer = Ext.extend(Ext.Panel, {
    symbolizer: null,
    initComponent: function () {
        this.items = [{
            xtype: "gx_fillsymbolizer",
            symbolizer: this.symbolizer,
            listeners: {
                change: function (symbolizer) {
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            }
        }, {
            xtype: "gx_strokesymbolizer",
            symbolizer: this.symbolizer,
            listeners: {
                change: function (symbolizer) {
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            }
        }];
        this.addEvents("change");
        Styler.PolygonSymbolizer.superclass.initComponent.call(this);
    }
});
Ext.reg('gx_polygonsymbolizer', Styler.PolygonSymbolizer);
