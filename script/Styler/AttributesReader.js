Ext.namespace("Styler.data");
Styler.data.AttributesReader = function (meta, recordType) {
    meta = meta || {};
    if (!meta.format) {
        meta.format = new OpenLayers.Format.WFSDescribeFeatureType();
    }
    Styler.data.AttributesReader.superclass.constructor.call(this, meta, recordType || meta.fields);
};

Ext.extend(Styler.data.AttributesReader, Ext.data.DataReader, {
    read: function (request) {
        var data = request.responseXML;
        if (!data || !data.documentElement) {
            data = request.responseText;
        }
        return this.readRecords(data);
    },
    readRecords: function (data) {
        var attributes;
        if (data instanceof Array) {
            attributes = data;
        } else {
            attributes = this.meta.format.read(data).featureTypes ? this.meta.format.read(data).featureTypes[0].properties :  [];
        }
        var recordType = this.recordType;
        var fields = recordType.prototype.fields;
        var numFields = fields.length;
        var attr, values, name, record, ignore, matches, value, records = [];
        for (var i = 0, len = attributes.length; i < len; ++i) {
            ignore = false;
            attr = attributes[i];
            values = {};
            for (var j = 0; j < numFields; ++j) {
                name = fields.items[j].name;
                value = attr[name];
                if (this.meta.ignore && this.meta.ignore[name]) {
                    matches = this.meta.ignore[name];
                    if (typeof matches == "string") {
                        ignore = (matches === value);
                    } else if (matches instanceof Array) {
                        ignore = (matches.indexOf(value) > -1);
                    } else if (matches instanceof RegExp) {
                        ignore = (matches.test(value));
                    }
                    if (ignore) {
                        break;
                    }
                }
                values[name] = attr[name];
            }
            if (!ignore) {
                records[records.length] = new recordType(values);
            }
        }
        return {
            success: true,
            records: records,
            totalRecords: records.length
        };
    }
});
