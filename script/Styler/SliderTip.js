Ext.namespace("Styler");
Styler.SliderTip = Ext.extend(Ext.Tip, {
    hover: true,
    dragging: false,
    minWidth: 10,
    minWidth: 10,
    offsets: [0, - 10],
    init: function (slider) {
        slider.on('dragstart', this.onSlide, this);
        slider.on('drag', this.onSlide, this);
        slider.on('dragend', this.hide, this);
        slider.on('destroy', this.destroy, this);
        this.slider = slider;
        if (this.hover) {
            slider.on('render', this.registerThumbListeners, this);
        }
    },
    registerThumbListeners: function () {
        console.log("could not register events");
        return;
        this.slider.thumb.on({
            "mouseover": function () {
                this.onSlide(this.slider);
                this.dragging = false;
            },
            "mouseout": function () {
                if (!this.dragging) {
                    this.hide.apply(this, arguments);
                }
            },
            scope: this
        });
    },
    onSlide: function (slider) {
        this.dragging = true;
        this.show();
        this.body.update(this.getText(slider));
        this.doAutoWidth();
        this.el.alignTo(slider.thumb, 'b-t?', this.offsets);
    },
    getText: function (slider) {
        return slider.getValue();
    }
});
