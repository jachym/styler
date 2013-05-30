Ext.namespace("Styler");

Styler.ScaleSliderTip = Ext.extend(Styler.SliderTip, {
    template: '<div>Zoom Level: {zoom}</div>' + '<div>Resolution: {resolution}</div>' + '<div>Scale: 1 : {scale}</div>',
    compiledTemplate: null,
    init: function (slider) {
        this.compiledTemplate = new Ext.Template(this.template);
        Styler.ScaleSliderTip.superclass.init.call(this, slider);
    },
    getText: function (slider) {
        var data = {
            zoom: slider.getZoom(),
            resolution: slider.getResolution(),
            scale: Math.round(slider.getScale())
        };
        return this.compiledTemplate.apply(data);
    }
});
