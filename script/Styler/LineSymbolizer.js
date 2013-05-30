Ext.namespace("Styler");
Styler.LineSymbolizer = Ext.extend(Ext.Panel, {
    symbolizer: null,
    initComponent: function () {
        this.items = [{
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
        Styler.LineSymbolizer.superclass.initComponent.call(this);
    }
});
Ext.reg('gx_linesymbolizer', Styler.LineSymbolizer);
