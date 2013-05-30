Ext.namespace("Styler.form");
Styler.form.ColorField = Ext.extend(Ext.form.TextField, {
    cssColors: {
        aqua: "#00FFFF",
        black: "#000000",
        blue: "#0000FF",
        fuchsia: "#FF00FF",
        gray: "#808080",
        green: "#008000",
        lime: "#00FF00",
        maroon: "#800000",
        navy: "#000080",
        olive: "#808000",
        purple: "#800080",
        red: "#FF0000",
        silver: "#C0C0C0",
        teal: "#008080",
        white: "#FFFFFF",
        yellow: "#FFFF00"
    },
    initComponent: function () {
        Styler.form.ColorField.superclass.initComponent.call(this);
        this.on({
            valid: this.colorField,
            scope: this
        });
    },
    isDark: function (hex) {
        var dark = false;
        if (hex) {
            var r = parseInt(hex.substring(1, 3), 16) / 255;
            var g = parseInt(hex.substring(3, 5), 16) / 255;
            var b = parseInt(hex.substring(5, 7), 16) / 255;
            var brightness = (r * 0.299) + (g * 0.587) + (b * 0.144);
            dark = brightness < 0.5;
        }
        return dark;
    },
    colorField: function () {
        var color = this.getValue();
        var hex = this.colorToHex(color) || "#ffffff";
        this.getEl().setStyle({
            "background": hex,
            "color": this.isDark(hex) ? "#ffffff" : "#000000"
        });
    },
    getHexValue: function () {
        return this.colorToHex(this.getValue());
    },
    colorToHex: function (color) {
        var hex;
        if (color.match(/^#[0-9a-f]{6}$/i)) {
            hex = color;
        } else {
            hex = this.cssColors[color.toLowerCase()] || null;
        }
        return hex;
    }
});
Ext.reg("gx_colorfield", Styler.form.ColorField);
