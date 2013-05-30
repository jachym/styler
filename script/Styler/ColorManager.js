Ext.namespace("Styler");
Styler.ColorManager = function (config) {
    Ext.apply(this, config);
};
Ext.apply(Styler.ColorManager.prototype, {
    field: null,
    init: function (field) {
        this.register(field);
    },
    destroy: function () {
        if (this.field) {
            this.unregister(this.field);
        }
    },
    register: function (field) {
        if (this.field) {
            this.unregister(this.field);
        }
        this.field = field;
        field.on({
            focus: this.fieldFocus,
            destroy: this.destroy,
            scope: this
        });
    },
    unregister: function (field) {
        field.un("focus", this.fieldFocus, this);
        field.un("destroy", this.destroy, this);
        if (Styler.ColorManager.picker && field == this.field) {
            Styler.ColorManager.picker.un("pickcolor", this.setFieldValue, this);
        }
        this.field = null;
    },
    fieldFocus: function (field) {
        if (!Styler.ColorManager.pickerWin) {
            Styler.ColorManager.picker = new Ext.ux.ColorPanel({
                hidePanel: false,
                autoHeight: false
            });
            Styler.ColorManager.pickerWin = new Ext.Window({
                title: "Color Picker",
                layout: "fit",
                closeAction: "hide",
                width: 405,
                height: 300,
                plain: true,
                items: Styler.ColorManager.picker
            });
        }
        Styler.ColorManager.picker.purgeListeners();
        this.setPickerValue();
        Styler.ColorManager.picker.on({
            pickcolor: this.setFieldValue,
            scope: this
        });
        Styler.ColorManager.pickerWin.show();
    },
    setFieldValue: function (picker, color) {
        if (this.field.isVisible()) {
            this.field.setValue("#" + color);
        }
    },
    setPickerValue: function () {
        var field = this.field;
        var hex = field.getHexValue ? field.getHexValue() : field.getValue();
        if (hex) {
            Styler.ColorManager.picker.setColor(hex.substring(1));
        }
    }
});
Styler.ColorManager.picker = null;
Styler.ColorManager.pickerWin = null;
