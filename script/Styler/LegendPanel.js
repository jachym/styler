Ext.namespace("Styler");

Styler.LegendPanel = Ext.extend(Ext.Panel, {
    symbolType: "Point",
    rules: null,
    untitledPrefix: "Untitled ",
    clickableSymbol: false,
    clickableTitle: false,
    selectOnClick: false,
    enableDD: true,
    selectedRule: null,
    untitledCount: 0,
    initComponent: function () {
        var defConfig = {
            plain: true,
            rules: []
        };
        Ext.applyIf(this, defConfig);
        this.rulesContainer = new Ext.Panel({
            border: false
        });
        this.items = [this.rulesContainer];
        this.addEvents("titleclick", "symbolclick", "ruleclick", "ruleselected", "ruleunselected", "rulemoved");
        Styler.LegendPanel.superclass.initComponent.call(this);
        this.update();
    },
    addRuleEntry: function (rule) {
        this.rulesContainer.add(this.createRuleEntry(rule));
    },
    selectRuleEntry: function (rule) {
        var newSelection = rule != this.selectedRule;
        if (this.selectedRule) {
            this.unselect();
        }
        if (newSelection) {
            var ruleEntry = this.rulesContainer.items.get(this.rules.indexOf(rule));
            ruleEntry.body.addClass("x-grid3-row-selected");
            this.selectedRule = rule;
            this.fireEvent("ruleselected", this, rule);
        }
    },
    unselect: function () {
        this.rulesContainer.items.each(function (item, i) {
            if (this.rules[i] == this.selectedRule) {
                item.body.removeClass("x-grid3-row-selected");
                this.selectedRule = null;
                this.fireEvent("ruleunselected", this, this.rules[i]);
            }
        }, this);
    },
    createRuleEntry: function (rule) {
        var symbolType = Styler.Util.getSymbolTypeFromRule(rule) || (rule[this.symbolType] ? this.symbolType : "Point");
        return {
            xtype: "panel",
            layout: "column",
            border: false,
            bodyStyle: this.selectOnClick ? {
                cursor: "pointer"
            } : undefined,
            defaults: {
                border: false
            },
            items: [{
                xtype: "gx_renderer",
                symbolType: symbolType,
                symbolizer: rule.symbolizer[symbolType] || rule.symbolizer,
                style: this.clickableSymbol ? {
                    cursor: "pointer"
                } : undefined,
                listeners: {
                    click: function () {
                        if (this.clickableSymbol) {
                            this.fireEvent("symbolclick", this, rule);
                            this.fireEvent("ruleclick", this, rule);
                        }
                    },
                    scope: this
                }
            }, {
                cls: "x-form-item",
                style: "padding: 0.2em 0.5em 0;",
                bodyStyle: Ext.applyIf({
                    background: "transparent"
                }, this.clickableTitle ? {
                    cursor: "pointer"
                } : undefined),
                html: this.getRuleTitle(rule),
                listeners: {
                    render: function (comp) {
                        this.clickableTitle && comp.getEl().on({
                            click: function () {
                                this.fireEvent("titleclick", this, rule);
                                this.fireEvent("ruleclick", this, rule);
                            },
                            scope: this
                        });
                    },
                    scope: this
                }
            }],
            listeners: {
                render: function (comp) {
                    this.selectOnClick && comp.getEl().on({
                        click: function (comp) {
                            this.selectRuleEntry(rule);
                        },
                        scope: this
                    });
                    if (this.enableDD == true) {
                        this.addDD(comp);
                    }
                },
                scope: this
            }
        }
    },
    addDD: function (component) {
        var cursor = component.body.getStyle("cursor");
        var dd = new Ext.Panel.DD(component);
        component.body.setStyle("cursor", cursor || "move");
        var panel = this;
        var dropZone = new Ext.dd.DropTarget(component.getEl(), {
            notifyDrop: function (ddSource) {
                var source = Ext.getCmp(ddSource.getEl().id);
                var target = Ext.getCmp(this.getEl().id);
                if (source && target && source != target) {
                    var sourceCt = source.ownerCt;
                    var targetCt = target.ownerCt;
                    if (sourceCt == targetCt) {
                        panel.moveRule(sourceCt.items.indexOf(source), targetCt.items.indexOf(target));
                    }
                }
            }
        });
    },
    update: function () {
        if (this.rulesContainer.items) {
            var comp;
            for (var i = this.rulesContainer.items.length - 1; i >= 0; --i) {
                comp = this.rulesContainer.getComponent(i);
                this.rulesContainer.remove(comp, true);
            }
        }
        var len = this.rules.length;
        var entry;
        for (var i = 0; i < len; ++i) {
            this.addRuleEntry(this.rules[i]);
        }
        this.doLayout();
    },
    moveRule: function (sourcePos, targetPos) {
        var srcRule = this.rules[sourcePos];
        this.rules.splice(sourcePos, 1);
        this.rules.splice(targetPos, 0, srcRule);
        this.update();
        this.fireEvent("rulemoved", this, srcRule);
    },
    getRuleTitle: function (rule) {
        return rule.title || rule.name || (this.untitledPrefix + (++this.untitledCount));
    }
});

Ext.reg('gx_legendpanel', Styler.LegendPanel);
