Ext.namespace("Styler");
Styler.FillSymbolizer = Ext.extend(Ext.FormPanel, {
    symbolizer: null,
    defaultSymbolizer: null,
    border: false,
    initComponent: function () {
        if (!this.symbolizer) {
            this.symbolizer = {};
        }
        Ext.applyIf(this.symbolizer, this.defaultSymbolizer);
        this.items = [{
            xtype: "fieldset",
            title: "Fill",
            autoHeight: true,
            defaults: {
                width: 100
            },
            items: [{
                xtype: "gx_colorfield",
                fieldLabel: "Color",
                name: "color",
                value: this.symbolizer["fillColor"],
                plugins: new Styler.ColorManager(),
                listeners: {
                    valid: function (field) {
                        this.symbolizer["fillColor"] = field.getValue();
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "slider",
                fieldLabel: "Opacity",
                name: "opacity",
                value: (this.symbolizer["fillOpacity"] == null) ? 100 : this.symbolizer["fillOpacity"] * 100,
                isFormField: true,
                listeners: {
                    changecomplete: function (slider, value) {
                        this.symbolizer["fillOpacity"] = value / 100;
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                },
                plugins: [new Styler.SliderTip({
                    getText: function (slider) {
                        return slider.getValue() + "%";
                    }
                })]
            }]
        }];
        this.addEvents("change");
        Styler.FillSymbolizer.superclass.initComponent.call(this);
    }
});
Ext.reg('gx_fillsymbolizer', Styler.FillSymbolizer);
