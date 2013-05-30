Ext.namespace("Styler.form");
Styler.form.FontComboBox = Ext.extend(Ext.form.ComboBox, {
    fonts: ["Arial", "Courier New", "Tahoma", "Times New Roman", "Verdana"],
    defaultFont: "Tahoma",
    allowBlank: false,
    mode: "local",
    triggerAction: "all",
    editable: false,
    initComponent: function () {
        var defConfig = {
            displayField: "text",
            valueField: "text",
            store: this.fonts,
            value: this.defaultFont,
            tpl: new Ext.XTemplate('<tpl for=".">' + '<div class="x-combo-list-item">' + '<span style="font-family: {field1};">{field1}</span>' + '</div></tpl>')
        };
        Ext.applyIf(this, defConfig);
        Styler.form.FontComboBox.superclass.initComponent.call(this);
    }
});
Ext.reg("gx_fontcombo", Styler.form.FontComboBox);
