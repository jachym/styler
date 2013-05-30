Ext.namespace("Styler.data");
Styler.data.AttributesStore = function (c) {
    Styler.data.AttributesStore.superclass.constructor.call(this, Ext.apply(c, {
        proxy: c.proxy || (!c.data ? new Ext.data.HttpProxy({
            url: c.url,
            disableCaching: false,
            method: "GET"
        }) : undefined),
        reader: new Styler.data.AttributesReader(c, c.fields || ["name", "type"])
    }));
};

Ext.extend(Styler.data.AttributesStore, Ext.data.Store);
