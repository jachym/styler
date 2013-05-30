Ext.namespace("Styler");
Styler.TextSymbolizer = Ext.extend(Ext.Panel, {
    symbolizer: null,
    defaultSymbolizer: null,
    attributes: null,
    haloCache: null,
    border: false,
    layout: "form",
    initComponent: function () {
        if (!this.symbolizer) {
            this.symbolizer = {};
        }
        Ext.applyIf(this.symbolizer, this.defaultSymbolizer);
        this.haloCache = {};
        var defAttributesComboConfig = {
            xtype: "combo",
            fieldLabel: "Label values",
            store: this.attributes,
            editable: false,
            triggerAction: "all",
            allowBlank: false,
            displayField: "name",
            valueField: "name",
            value: this.symbolizer.label && this.symbolizer.label.replace(/^\${(.*)}$/, "$1"),
            listeners: {
                select: function (combo, record) {
                    this.symbolizer.label = "${" + record.get("name") + "}";
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 120
        };
        this.attributesComboConfig = this.attributesComboConfig || {};
        Ext.applyIf(this.attributesComboConfig, defAttributesComboConfig);
        this.labelWidth = 80;
        this.items = [this.attributesComboConfig, {
            cls: "x-html-editor-tb",
            style: "background: transparent; border: none; padding: 0 0em 0.5em;",
            xtype: "toolbar",
            items: [{
                xtype: "gx_fontcombo",
                width: 110,
                value: this.symbolizer.fontFamily,
                listeners: {
                    select: function (combo, record) {
                        this.symbolizer.fontFamily = record.get("text");
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "tbtext",
                text: "Size: "
            }, {
                xtype: "textfield",
                value: this.symbolizer.fontSize,
                width: 30,
                listeners: {
                    valid: function (field) {
                        this.symbolizer.fontSize = Number(field.getValue());
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                enableToggle: true,
                cls: "x-btn-icon",
                iconCls: 'x-edit-bold',
                pressed: this.symbolizer.fontWeight === "bold",
                listeners: {
                    toggle: function (button, pressed) {
                        this.symbolizer.fontWeight = pressed ? "bold" : "normal";
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                enableToggle: true,
                cls: "x-btn-icon",
                iconCls: 'x-edit-italic',
                pressed: this.symbolizer.fontStyle === "italic",
                listeners: {
                    toggle: function (button, pressed) {
                        this.symbolizer.fontStyle = pressed ? "italic" : "normal";
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }]
        }, {
            xtype: "gx_fillsymbolizer",
            symbolizer: this.symbolizer,
            width: 213,
            labelWidth: 70,
            listeners: {
                change: function (symbolizer) {
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            }
        }, {
            xtype: "fieldset",
            title: "Halo",
            checkboxToggle: true,
            collapsed: !(this.symbolizer.haloRadius || this.symbolizer.haloColor || this.symbolizer.haloOpacity),
            autoHeight: true,
            labelWidth: 50,
            items: [{
                xtype: "textfield",
                fieldLabel: "Size",
                anchor: "89%",
                value: this.symbolizer.haloRadius || 12,
                listeners: {
                    valid: function (field) {
                        this.symbolizer.haloRadius = field.getValue();
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "gx_fillsymbolizer",
                symbolizer: {
                    fillColor: this.symbolizer.haloColor,
                    fillOpacity: this.symbolizer.haloOpacity
                },
                width: 190,
                labelWidth: 60,
                listeners: {
                    change: function (symbolizer) {
                        this.symbolizer.haloColor = symbolizer.fillColor;
                        this.symbolizer.haloOpacity = symbolizer.fillOpacity;
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }],
            listeners: {
                collapse: function () {
                    this.haloCache = {
                        haloRadius: this.symbolizer.haloRadius,
                        haloColor: this.symbolizer.haloColor,
                        haloOpacity: this.symbolizer.haloOpacity
                    };
                    delete this.symbolizer.haloRadius;
                    delete this.symbolizer.haloColor;
                    delete this.symbolizer.haloOpacity;
                    this.fireEvent("change", this.symbolizer)
                },
                expand: function () {
                    Ext.apply(this.symbolizer, this.haloCache);
                    this.doLayout();
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            }
        }];
        this.addEvents("change");
        Styler.TextSymbolizer.superclass.initComponent.call(this);
    }
});
Ext.reg('gx_textsymbolizer', Styler.TextSymbolizer);
