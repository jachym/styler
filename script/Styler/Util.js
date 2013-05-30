Ext.namespace("Styler.Util");
Styler.Util = {
    getSymbolTypeFromRule: function (rule) {
        var symbolizer = rule.symbolizer
        if (symbolizer["Line"] || symbolizer["Point"] || symbolizer["Polygon"]) {
            for (var type in symbolizer) {
                if (type != "Text") {
                    return type;
                }
            }
        }
    }
}
