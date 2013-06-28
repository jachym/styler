Ext.namespace("Styler");
Styler.ScaleLimitPanel = Ext.extend(Ext.Panel, {
    maxScaleLimit: 40075016.68 * 39.3701 * OpenLayers.DOTS_PER_INCH / 256,
    limitMaxScale: true,
    maxScaleDenominator: undefined,
    minScaleLimit: Math.pow(0.5, 19) * 40075016.68 * 39.3701 * OpenLayers.DOTS_PER_INCH / 256,
    limitMinScale: true,
    minScaleDenominator: undefined,
    scaleLevels: 20,
    scaleSliderTemplate: "{type} Scale 1:{scale}",
    modifyScaleTipContext: Ext.emptyFn,
    scaleFactor: null,
    changing: false,
    border: false,
    initComponent: function () {
        this.layout = "column";
        this.defaults = {
            border: false,
            bodyStyle: "margin: 0 5px;"
        };
        this.bodyStyle = {
            padding: "5px"
        };
        this.scaleSliderTemplate = new Ext.Template(this.scaleSliderTemplate);
        Ext.applyIf(this, {
            minScaleDenominator: this.minScaleLimit,
            maxScaleDenominator: this.maxScaleLimit
        });
        this.scaleFactor = Math.pow(this.maxScaleLimit / this.minScaleLimit, 1 / (this.scaleLevels - 1));
        this.scaleSlider = new Styler.MultiSlider({
            vertical: true,
            height: 100,
            listeners: {
                changecomplete: this.updateScaleValues,
                render: function (slider) {
                    slider.thumbs[0].setVisible(this.limitMaxScale);
                    slider.thumbs[1].setVisible(this.limitMinScale);
                    slider.setDisabled(!this.limitMinScale && !this.limitMaxScale);
                },
                scope: this
            },
            plugins: [new Styler.MultiSliderTip({
                getText: (function (slider, index) {
                    var values = slider.getValues();
                    var scales = this.sliderValuesToScale(values);
                    var data = {
                        scale: String(scales[index]),
                        zoom: (values[index] * (this.scaleLevels / 100)).toFixed(1),
                        type: (index === 0) ? "Max" : "Min",
                        zoomType: (index === 0) ? "Min" : "Max"
                    };
                    this.modifyScaleTipContext(this, data);
                    return this.scaleSliderTemplate.apply(data);
                }).createDelegate(this)
            })]
        });
        this.maxScaleInput = new Ext.form.TextField({
            width: 100,
            fieldLabel: "1",
            value: Math.round(this.maxScaleDenominator),
            disabled: !this.limitMaxScale,
            listeners: {
                valid: function (field) {
                    var value = Number(field.getValue());
                    var limit = Math.round(this.maxScaleLimit);
                    if (value > limit) {
                        field.setValue(limit);
                    } else if (value < this.minScaleDenominator) {
                        field.setValue(this.minScaleDenominator);
                    } else {
                        this.maxScaleDenominator = value;
                        this.updateSliderValues();
                    }
                },
                scope: this
            }
        });
        this.minScaleInput = new Ext.form.TextField({
            width: 100,
            fieldLabel: "1",
            value: Math.round(this.minScaleDenominator),
            disabled: !this.limitMinScale,
            listeners: {
                valid: function (field) {
                    var value = Number(field.getValue());
                    var limit = Math.round(this.minScaleLimit);
                    if (value < limit) {
                        field.setValue(limit);
                    } else if (value > this.maxScaleDenominator) {
                        field.setValue(this.maxScaleDenominator);
                    } else {
                        this.minScaleDenominator = value;
                        this.updateSliderValues();
                    }
                },
                scope: this
            }
        });
        this.items = [this.scaleSlider, {
            xtype: "panel",
            layout: "form",
            defaults: {
                border: false
            },
            items: [{
                labelWidth: 90,
                layout: "form",
                width: 150,
                items: [{
                    xtype: "checkbox",
                    checked: !! this.limitMinScale,
                    fieldLabel: "Min scale limit",
                    listeners: {
                        check: function (box, checked) {
                            this.limitMinScale = checked;
                            var slider = this.scaleSlider;
                            var values = slider.getValues();
                            values[1] = 100;
                            slider.setValues(values);
                            slider.thumbs[1].setVisible(checked);
                            this.minScaleInput.setDisabled(!checked);
                            this.updateScaleValues(slider, values);
                            slider.setDisabled(!this.limitMinScale && !this.limitMaxScale);
                        },
                        scope: this
                    }
                }]
            }, {
                labelWidth: 10,
                layout: "form",
                items: [this.minScaleInput]
            }, {
                labelWidth: 90,
                layout: "form",
                items: [{
                    xtype: "checkbox",
                    checked: !! this.limitMaxScale,
                    fieldLabel: "Max scale limit",
                    listeners: {
                        check: function (box, checked) {
                            this.limitMaxScale = checked;
                            var slider = this.scaleSlider;
                            var values = slider.getValues();
                            values[0] = 0;
                            slider.setValues(values);
                            slider.thumbs[0].setVisible(checked);
                            this.maxScaleInput.setDisabled(!checked);
                            this.updateScaleValues(slider, values);
                            slider.setDisabled(!this.limitMinScale && !this.limitMaxScale);
                        },
                        scope: this
                    }
                }]
            }, {
                labelWidth: 10,
                layout: "form",
                items: [this.maxScaleInput]
            }]
        }];
        this.addEvents("change");
        Styler.ScaleLimitPanel.superclass.initComponent.call(this);
    },
    updateScaleValues: function (slider, values) {
        if (!this.changing) {
            var resetSlider = false;
            if (!this.limitMaxScale) {
                if (values[0] > 0) {
                    values[0] = 0;
                    resetSlider = true;
                }
            }
            if (!this.limitMinScale) {
                if (values[1] < 100) {
                    values[1] = 100;
                    resetSlider = true;
                }
            }
            if (resetSlider) {
                slider.setValues(values);
            } else {
                var scales = this.sliderValuesToScale(values);
                var max = scales[0];
                var min = scales[1];
                this.changing = true;
                this.minScaleInput.setValue(min);
                this.maxScaleInput.setValue(max);
                this.changing = false;
                this.fireEvent("change", this, (this.limitMinScale) ? min : undefined, (this.limitMaxScale) ? max : undefined);
            }
        }
    },
    updateSliderValues: function () {
        if (!this.changing) {
            var min = this.minScaleDenominator;
            var max = this.maxScaleDenominator;
            var values = this.scaleToSliderValues([max, min]);
            this.changing = true;
            this.scaleSlider.setValues(values);
            this.changing = false;
            this.fireEvent("change", this, (this.limitMinScale) ? min : undefined, (this.limitMaxScale) ? max : undefined);
        }
    },
    sliderValuesToScale: function (values) {
        var interval = 100 / (this.scaleLevels - 1);
        return [Math.round(Math.pow(this.scaleFactor, (100 - values[0]) / interval) * this.minScaleLimit), Math.round(Math.pow(this.scaleFactor, (100 - values[1]) / interval) * this.minScaleLimit)];
    },
    scaleToSliderValues: function (scales) {
        var interval = 100 / (this.scaleLevels - 1);
        return [100 - (interval * Math.log(scales[0] / this.minScaleLimit) / Math.log(this.scaleFactor)), 100 - (interval * Math.log(scales[1] / this.minScaleLimit) / Math.log(this.scaleFactor))];
    }
});
Ext.reg('gx_scalelimitpanel', Styler.ScaleLimitPanel);
