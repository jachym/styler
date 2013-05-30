Ext.namespace("Styler");
Styler.StrokeSymbolizer = Ext.extend(Ext.FormPanel, {
    symbolizer: null,
    defaultSymbolizer: null,
    dashStyles: [
        ["solid", ["solid"],0],
        ["dash", "dash",0],
        ["dot", "dot",0]
    ],
    border: false,
    initComponent: function () {
        if (!this.symbolizer) {
            this.symbolizer = {};
        }
        Ext.applyIf(this.symbolizer, this.defaultSymbolizer);

        // set propper value and code data fields
        this.dashStyles[0][2] = 0*this.symbolizer.strokeWidth;
        this.dashStyles[1][2] = 4*this.symbolizer.strokeWidth;
        this.dashStyles[2][2] = 1*this.symbolizer.strokeWidth;

        // try to determine type of stroke: solid, dash or dot
        var displayStyle = this.symbolizer.strokeDashstyle;
        if (displayStyle) {
            displayStyle  = parseFloat(displayStyle.split(" ")[0]);

            if (typeof(displayStyle) == "number") {
                // dash
                if (displayStyle > this.dashStyles[2][2]) {
                    displayStyle = this.dashStyles[1][0];
                }
                // dot
                else if (displayStyle <= this.dashStyles[2][0]) {
                    displayStyle = this.dashStyles[2][0];
                }
                // solid
                else {
                    displayStyle = this.dashStyles[0][0];
                }
            }
        }

        this.items = [{
            xtype: "fieldset",
            title: "Stroke",
            autoHeight: true,
            defaults: {
                width: 100
            },
            items: [{
                xtype: "combo",
                name: "style",
                fieldLabel: "Style",
                store: new Ext.data.SimpleStore({
                    data: this.dashStyles,
                    fields: ["value", "display","code"]
                }),
                displayField: "display",
                valueField: "value",
                //value: this.symbolizer["strokeDashstyle"],
                value: displayStyle,
                mode: "local",
                allowBlank: true,
                triggerAction: "all",
                editable: false,
                listeners: {
                    select: function (combo, record) {
                        var val = combo.getValue();
                        var vals = this.form.getFieldValues();
                        var len;
                        switch(val) {
                            case "dash":
                                len = String(parseFloat(vals.width)*4);
                                this.symbolizer.strokeDashstyle = len+" "+len;
                                break;
                            case "dot":
                                len = String(parseFloat(vals.width)*1);
                                this.symbolizer.strokeDashstyle = len+" "+len;
                                break;
                            default:
                                this.symbolizer.strokeDashstyle = "solid";
                                break;
                        }
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "gx_colorfield",
                name: "color",
                fieldLabel: "Color",
                value: this.symbolizer["strokeColor"],
                plugins: new Styler.ColorManager(),
                listeners: {
                    valid: function (field) {
                        this.symbolizer["strokeColor"] = field.getValue();
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "textfield",
                name: "width",
                fieldLabel: "Width",
                value: this.symbolizer["strokeWidth"] || 2,
                listeners: {
                    change: function (field, value) {
                        this.symbolizer["strokeWidth"] = value;
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "slider",
                name: "opacity",
                fieldLabel: "Opacity",
                value: (this.symbolizer["strokeOpacity"] == null) ? 100 : this.symbolizer["strokeOpacity"] * 100,
                isFormField: true,
                listeners: {
                    changecomplete: function (slider, value) {
                        this.symbolizer["strokeOpacity"] = value / 100;
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
        Styler.StrokeSymbolizer.superclass.initComponent.call(this);
    }
});
Ext.reg('gx_strokesymbolizer', Styler.StrokeSymbolizer);
