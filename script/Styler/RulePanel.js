Ext.namespace("Styler");
Styler.RulePanel = Ext.extend(Ext.TabPanel, {
    symbolType: "Point",
    rule: null,
    attributes: null,
    nestedFilters: true,
    minScaleLimit: Math.pow(0.5, 19) * 40075016.68 * 39.3701 * OpenLayers.DOTS_PER_INCH / 256,
    maxScaleLimit: 40075016.68 * 39.3701 * OpenLayers.DOTS_PER_INCH / 256,
    scaleLevels: 20,
    scaleSliderTemplate: "{type} Scale 1:{scale}",
    modifyScaleTipContext: Ext.emptyFn,
    initComponent: function () {
        var defConfig = {
            plain: true,
            border: false
        };
        Ext.applyIf(this, defConfig);
        if (!this.rule) {
            this.rule = new OpenLayers.Rule({
                name: this.uniqueRuleName()
            });
        }
        this.activeTab = 0;
        this.textSymbolizer = new Styler.TextSymbolizer({
            symbolizer: this.rule.symbolizer["Text"],
            attributes: this.attributes,
            listeners: {
                change: function (symbolizer) {
                    this.fireEvent("change", this, this.rule);
                },
                scope: this
            }
        });
        this.scaleLimitPanel = new Styler.ScaleLimitPanel({
            maxScaleDenominator: this.rule && (this.rule.maxScaleDenominator || undefined),
            limitMaxScale: !! (this.rule && this.rule.maxScaleDenominator),
            minScaleDenominator: this.rule && (this.rule.minScaleDenominator || undefined),
            limitMinScale: !! (this.rule && this.rule.minScaleDenominator),
            scaleLevels: this.scaleLevels,
            scaleSliderTemplate: this.scaleSliderTemplate,
            modifyScaleTipContext: this.modifyScaleTipContext,
            listeners: {
                change: function (comp, min, max) {
                    this.rule.minScaleDenominator = min;
                    this.rule.maxScaleDenominator = max;
                    this.fireEvent("change", this, this.rule);
                },
                scope: this
            }
        });
        this.filterBuilder = new Styler.FilterBuilder({
            allowGroups: this.nestedFilters,
            filter: this.rule && this.rule.filter,
            attributes: this.attributes,
            listeners: {
                change: function (builder) {
                    var filter = builder.getFilter();
                    this.rule.filter = filter;
                    this.fireEvent("change", this, this.rule)
                },
                scope: this
            }
        });
        this.items = [{
            title: "Labels",
            autoScroll: true,
            bodyStyle: {
                "padding": "10px"
            },
            items: [{
                xtype: "fieldset",
                title: "Label Features",
                autoHeight: true,
                checkboxToggle: true,
                collapsed: !this.rule.symbolizer["Text"],
                items: [this.textSymbolizer],
                listeners: {
                    collapse: function () {
                        delete this.rule.symbolizer["Text"];
                        this.fireEvent("change", this, this.rule);
                    },
                    expand: function () {
                        this.rule.symbolizer["Text"] = this.textSymbolizer.symbolizer;
                        this.doLayout();
                        this.fireEvent("change", this, this.rule);
                    },
                    scope: this
                }
            }]
        }];
        if (Styler.Util.getSymbolTypeFromRule(this.rule) || this.symbolType) {
            this.items = [{
                title: "Basic",
                autoScroll: true,
                items: [this.createHeaderPanel(), this.createSymbolizerPanel()]
            },
            this.items[0], {
                title: "Advanced",
                defaults: {
                    style: {
                        margin: "7px"
                    }
                },
                autoScroll: true,
                items: [{
                    xtype: "fieldset",
                    title: "Limit by scale",
                    checkboxToggle: true,
                    collapsed: !(this.rule && (this.rule.minScaleDenominator || this.rule.maxScaleDenominator)),
                    autoHeight: true,
                    items: [this.scaleLimitPanel],
                    listeners: {
                        collapse: function () {
                            delete this.rule.minScaleDenominator;
                            delete this.rule.maxScaleDenominator;
                            this.fireEvent("change", this, this.rule)
                        },
                        expand: function () {
                            var changed = false;
                            this.doLayout();
                            if (this.scaleLimitPanel.limitMinScale) {
                                this.rule.minScaleDenominator = this.scaleLimitPanel.minScaleDenominator;
                                changed = true;
                            }
                            if (this.scaleLimitPanel.limitMaxScale) {
                                this.rule.maxScaleDenominator = this.scaleLimitPanel.maxScaleDenominator;
                                changed = true;
                            }
                            if (changed) {
                                this.fireEvent("change", this, this.rule)
                            }
                        },
                        scope: this
                    }
                }, {
                    xtype: "fieldset",
                    title: "Limit by condition",
                    checkboxToggle: true,
                    collapsed: !(this.rule && this.rule.filter),
                    autoHeight: true,
                    items: [this.filterBuilder],
                    listeners: {
                        collapse: function () {
                            delete this.rule.filter;
                            this.fireEvent("change", this, this.rule)
                        },
                        expand: function () {
                            var changed = false;
                            this.doLayout();
                            this.rule.filter = this.filterBuilder.getFilter();
                            this.fireEvent("change", this, this.rule)
                        },
                        scope: this
                    }
                }]
            }]
        };
        this.items[0].autoHeight = true;
        this.addEvents("change");
        this.on({
            tabchange: function (panel, tab) {
                tab.doLayout();
            },
            scope: this
        });
        Styler.RulePanel.superclass.initComponent.call(this);
    },
    uniqueRuleName: function () {
        return OpenLayers.Util.createUniqueID("rule_");
    },
    createHeaderPanel: function () {
        this.symbolizerSwatch = new Styler.FeatureRenderer({
            symbolType: this.symbolType,
            symbolizer: this.rule.symbolizer[this.symbolType],
            isFormField: true,
            fieldLabel: "Symbol"
        });
        return {
            xtype: "form",
            border: false,
            labelAlign: "top",
            defaults: {
                border: false
            },
            style: {
                "padding": "0.3em 0 0 1em"
            },
            items: [{
                layout: "column",
                defaults: {
                    border: false,
                    style: {
                        "padding-right": "1em"
                    }
                },
                items: [{
                    layout: "form",
                    width: 150,
                    items: [{
                        xtype: "textfield",
                        fieldLabel: "Name",
                        anchor: "95%",
                        value: this.rule && (this.rule.title || this.rule.name || ""),
                        listeners: {
                            change: function (el, value) {
                                this.rule.title = value;
                                this.fireEvent("change", this, this.rule);
                            },
                            scope: this
                        }
                    }]
                }, {
                    layout: "form",
                    width: 70,
                    items: [this.symbolizerSwatch]
                }]
            }]
        };
    },
    createSymbolizerPanel: function () {
        return {
            xtype: "gx_" + this.symbolType.toLowerCase() + "symbolizer",
            symbolizer: this.rule.symbolizer[this.symbolType],
            pointGraphics: (this.symbolType === "Point") ? this.pointGraphics : undefined,
            bodyStyle: {
                "padding": "10px"
            },
            border: false,
            labelWidth: 70,
            defaults: {
                labelWidth: 70
            },
            listeners: {
                change: function (symbolizer) {
                    this.symbolizerSwatch.setSymbolizer(symbolizer);
                    this.fireEvent("change", this, this.rule);
                },
                scope: this
            }
        };
    }
});
Ext.reg('gx_rulepanel', Styler.RulePanel);
