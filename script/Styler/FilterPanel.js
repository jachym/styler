Ext.namespace("Styler");
Styler.FilterPanel = Ext.extend(Ext.Panel, {
    filter: null,
    attributes: null,
    attributesComboConfig: null,
    initComponent: function () {
        var defConfig = {
            plain: true,
            border: false
        };
        Ext.applyIf(this, defConfig);
        if (!this.filter) {
            this.filter = this.createDefaultFilter();
        }
        if (!this.attributes) {
            this.attributes = new Styler.data.AttributesStore();
        }
        var defAttributesComboConfig = {
            xtype: "combo",
            store: this.attributes,
            editable: false,
            triggerAction: "all",
            hideLabel: true,
            allowBlank: false,
            displayField: "name",
            valueField: "name",
            value: this.filter.property,
            listeners: {
                select: function (combo, record) {
                    this.filter.property = record.get("name");
                    this.fireEvent("change", this.filter);
                },
                scope: this
            },
            width: 120
        };
        this.attributesComboConfig = this.attributesComboConfig || {};
        Ext.applyIf(this.attributesComboConfig, defAttributesComboConfig);
        this.items = this.createFilterItems();
        this.addEvents("change");
        Styler.FilterPanel.superclass.initComponent.call(this);
    },
    createDefaultFilter: function () {
        return new OpenLayers.Filter.Comparison();
    },
    createFilterItems: function () {
        return [{
            layout: "column",
            border: false,
            defaults: {
                border: false
            },
            items: [{
                width: this.attributesComboConfig.width,
                items: [this.attributesComboConfig]
            }, {
                items: [{
                    xtype: "gx_comparisoncombo",
                    value: this.filter.type,
                    listeners: {
                        select: function (combo, record) {
                            this.filter.type = record.get("value");
                            this.fireEvent("change", this.filter);
                        },
                        scope: this
                    }
                }]
            }, {
                items: [{
                    xtype: "textfield",
                    width: 120,
                    value: this.filter.value,
                    allowBlank: false,
                    listeners: {
                        change: function (el, value) {
                            this.filter.value = value;
                            this.fireEvent("change", this.filter);
                        },
                        scope: this
                    }
                }]
            }]
        }];
    }
});
Ext.reg('gx_filterpanel', Styler.FilterPanel);
