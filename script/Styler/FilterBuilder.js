Ext.namespace("Styler");
Styler.FilterBuilder = Ext.extend(Ext.Panel, {
    builderTypeNames: ["any", "all", "none", "not all"],
    allowedBuilderTypes: null,
    rowHeight: 25,
    builderType: null,
    childFiltersPanel: null,
    customizeFilterOnInit: true,
    preComboText: "Match",
    postComboText: "of the following:",
    allowGroups: true,
    initComponent: function () {
        var defConfig = {
            plain: true,
            border: false,
            defaultBuilderType: Styler.FilterBuilder.ANY_OF
        };
        Ext.applyIf(this, defConfig);
        if (this.customizeFilterOnInit) {
            this.filter = this.customizeFilter(this.filter);
        }
        this.builderType = this.getBuilderType();
        this.items = [{
            xtype: "panel",
            border: false,
            items: [{
                xtype: "panel",
                border: false,
                layout: "column",
                style: "margin-top: 0.25em;",
                defaults: {
                    border: false
                },
                items: [{
                    html: this.preComboText,
                    cls: "x-form-item",
                    style: "padding: 0.3em 0.5em 0;"
                }, {
                    items: [this.createBuilderTypeCombo()]
                }, {
                    html: this.postComboText,
                    cls: "x-form-item",
                    style: "padding: 0.3em 0.5em 0;"
                }]
            }]
        },
        this.createChildFiltersPanel()];
        this.bbar = this.createToolBar();
        this.addEvents("change");
        Styler.FilterBuilder.superclass.initComponent.call(this);
    },
    createToolBar: function () {
        var bar = [{
            text: "add condition",
            iconCls: "add",
            handler: function () {
                this.addCondition();
            },
            scope: this
        }];
        if (this.allowGroups) {
            bar.push({
                text: "add group",
                iconCls: "add",
                handler: function () {
                    this.addCondition(true);
                },
                scope: this
            });
        }
        return bar;
    },
    getFilter: function () {
        var filter;
        if (this.filter) {
            filter = this.filter.clone();
            if (filter instanceof OpenLayers.Filter.Logical) {
                filter = this.cleanFilter(filter);
            }
        }
        return filter;
    },
    cleanFilter: function (filter) {
        if (filter instanceof OpenLayers.Filter.Logical) {
            if (filter.type !== OpenLayers.Filter.Logical.NOT && filter.filters.length === 1) {
                filter = this.cleanFilter(filter.filters[0]);
            } else {
                var child;
                for (var i = 0, len = filter.filters.length; i < len; ++i) {
                    child = filter.filters[i];
                    if (child instanceof OpenLayers.Filter.Logical) {
                        filter.filters[i] = this.cleanFilter(child)
                    }
                }
            }
        }
        return filter;
    },
    customizeFilter: function (filter) {
        if (!filter) {
            filter = this.wrapFilter(this.createDefaultFilter());
        } else {
            filter = this.cleanFilter(filter);
            switch (filter.type) {
            case OpenLayers.Filter.Logical.AND:
            case OpenLayers.Filter.Logical.OR:
                if (!filter.filters || filter.filters.length === 0) {
                    filter.filters = [this.createDefaultFilter()];
                } else {
                    var child;
                    for (var i = 0, len = filter.filters.length; i < len; ++i) {
                        child = filter.filters[i];
                        if (child instanceof OpenLayers.Filter.Logical) {
                            filter.filters[i] = this.customizeFilter(child);
                        }
                    }
                }
                filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.OR,
                    filters: [filter]
                });
                break;
            case OpenLayers.Filter.Logical.NOT:
                if (!filter.filters || filter.filters.length === 0) {
                    filter.filters = [new OpenLayers.Filter.Logical({
                        type: OpenLayers.Filter.Logical.OR,
                        filters: [this.createDefaultFilter()]
                    })];
                } else {
                    var child = filter.filters[0];
                    if (child instanceof OpenLayers.Filter.Logical) {
                        if (child.type !== OpenLayers.Filter.Logical.NOT) {
                            var grandchild;
                            for (var i = 0, len = child.filters.length; i < len; ++i) {
                                grandchild = child.filters[i];
                                if (grandchild instanceof OpenLayers.Filter.Logical) {
                                    child.filters[i] = this.customizeFilter(grandchild);
                                }
                            }
                        } else {
                            if (child.filters && child.filters.length > 0) {
                                filter = this.customizeFilter(child.filters[0]);
                            } else {
                                filter = this.wrapFilter(this.createDefaultFilter());
                            }
                        }
                    } else {
                        var type;
                        if (this.defaultBuilderType === Styler.FilterBuilder.NOT_ALL_OF) {
                            type = OpenLayers.Logical.Filter.AND;
                        } else {
                            type = OpenLayers.Logical.Filter.OR;
                        }
                        filter.filters = [new OpenLayers.Filter.Logical({
                            type: type,
                            filters: [child]
                        })];
                    }
                }
                break;
            default:
                filter = this.wrapFilter(filter);
            }
        }
        return filter;
    },
    createDefaultFilter: function () {
        return new OpenLayers.Filter.Comparison();
    },
    wrapFilter: function (filter) {
        var type;
        if (this.defaultBuilderType === Styler.FilterBuilder.ALL_OF) {
            type = OpenLayers.Filter.Logical.AND;
        } else {
            type = OpenLayers.Filter.Logical.OR;
        }
        return new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.OR,
            filters: [new OpenLayers.Filter.Logical({
                type: type,
                filters: [filter]
            })]
        });
    },
    addCondition: function (group) {
        var filter, type;
        if (group) {
            type = "gx_filterbuilder";
            filter = this.wrapFilter(this.createDefaultFilter());
        } else {
            type = "gx_filterpanel";
            filter = this.createDefaultFilter();
        }
        var newChild = this.newRow({
            xtype: type,
            filter: filter,
            attributes: this.attributes,
            customizeFilterOnInit: group && false,
            listeners: {
                change: function () {
                    this.fireEvent("change", this);
                },
                scope: this
            }
        });
        this.childFiltersPanel.add(newChild);
        this.filter.filters[0].filters.push(filter);
        this.childFiltersPanel.doLayout();
    },
    removeCondition: function (panel, filter) {
        var parent = this.filter.filters[0].filters;
        if (parent.length > 1) {
            parent.remove(filter);
            this.childFiltersPanel.remove(panel);
        }
        this.fireEvent("change", this);
    },
    createBuilderTypeCombo: function () {
        var types = this.allowedBuilderTypes || [Styler.FilterBuilder.ANY_OF, Styler.FilterBuilder.ALL_OF, Styler.FilterBuilder.NONE_OF];
        var numTypes = types.length;
        var data = new Array(numTypes);
        var type;
        for (var i = 0; i < numTypes; ++i) {
            type = types[i];
            data[i] = [type, this.builderTypeNames[type]];
        }
        return {
            xtype: "combo",
            store: new Ext.data.SimpleStore({
                data: data,
                fields: ["value", "name"]
            }),
            value: this.builderType,
            displayField: "name",
            valueField: "value",
            triggerAction: "all",
            mode: "local",
            listeners: {
                select: function (combo, record) {
                    this.changeBuilderType(record.get("value"));
                    this.fireEvent("change", this);
                },
                scope: this
            },
            width: 60
        };
    },
    changeBuilderType: function (type) {
        if (type !== this.builderType) {
            this.builderType = type;
            var child = this.filter.filters[0];
            switch (type) {
            case Styler.FilterBuilder.ANY_OF:
                this.filter.type = OpenLayers.Filter.Logical.OR;
                child.type = OpenLayers.Filter.Logical.OR;
                break;
            case Styler.FilterBuilder.ALL_OF:
                this.filter.type = OpenLayers.Filter.Logical.OR;
                child.type = OpenLayers.Filter.Logical.AND;
                break;
            case Styler.FilterBuilder.NONE_OF:
                this.filter.type = OpenLayers.Filter.Logical.NOT;
                child.type = OpenLayers.Filter.Logical.OR;
                break;
            case Styler.FilterBuilder.NOT_ALL_OF:
                this.filter.type = OpenLayers.Filter.Logical.NOT;
                child.type = OpenLayers.Filter.Logical.AND;
                break;
            }
        }
    },
    createChildFiltersPanel: function () {
        this.childFiltersPanel = new Ext.Panel({
            border: false,
            defaults: {
                border: false
            }
        });
        var grandchildren = this.filter.filters[0].filters;
        var grandchild;
        for (var i = 0, len = grandchildren.length; i < len; ++i) {
            grandchild = grandchildren[i];
            this.childFiltersPanel.add(this.newRow({
                xtype: (grandchild instanceof OpenLayers.Filter.Logical) ? "gx_filterbuilder" : "gx_filterpanel",
                filter: grandchild,
                attributes: this.attributes,
                listeners: {
                    change: function () {
                        this.fireEvent("change", this);
                    },
                    scope: this
                }
            }));
        }
        return this.childFiltersPanel;
    },
    newRow: function (filterPanel) {
        var panel = new Ext.Panel({
            layout: "column",
            defaults: {
                border: false
            },
            style: "padding: 0.5em 0.25em;",
            items: [{
                border: false,
                columnWidth: 0.1,
                items: [{
                    xtype: "button",
                    tooltip: "remove condition",
                    cls: 'x-btn-icon',
                    iconCls: "delete",
                    handler: function () {
                        this.removeCondition(panel, filterPanel.filter);
                    },
                    scope: this
                }]
            }, {
                items: [filterPanel],
                border: false,
                columnWidth: 0.9
            }]
        });
        return panel;
    },
    getBuilderType: function () {
        var type = this.defaultBuilderType;
        if (this.filter) {
            var child = this.filter.filters[0];
            if (this.filter.type === OpenLayers.Filter.Logical.NOT) {
                switch (child.type) {
                case OpenLayers.Filter.Logical.OR:
                    type = Styler.FilterBuilder.NONE_OF;
                    break;
                case OpenLayers.Filter.Logical.AND:
                    type = Styler.FilterBuilder.NOT_ALL_OF;
                    break;
                }
            } else {
                switch (child.type) {
                case OpenLayers.Filter.Logical.OR:
                    type = Styler.FilterBuilder.ANY_OF;
                    break;
                case OpenLayers.Filter.Logical.AND:
                    type = Styler.FilterBuilder.ALL_OF;
                    break;
                }
            }
        }
        return type;
    }
});
Styler.FilterBuilder.ANY_OF = 0;
Styler.FilterBuilder.ALL_OF = 1;
Styler.FilterBuilder.NONE_OF = 2;
Styler.FilterBuilder.NOT_ALL_OF = 3;
Ext.reg('gx_filterbuilder', Styler.FilterBuilder);
