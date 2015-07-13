var xpath = require('xpath');

(function () {
    'use strict';

    exports.NS_XHTML = 'http://www.w3.org/1999/xhtml';
    exports.NS_PACKAGE_DOC = 'http://www.idpf.org/2007/opf';
    exports.NS_CONTAINER = 'urn:oasis:names:tc:opendocument:xmlns:container';

    exports.nsXPath = function(ns) {
        return xpath.useNamespaces({
            'main': ns
        }).apply(xpath, Array.prototype.slice.call(arguments, 1));
    };

    exports.htmlXPath = function () {
        return xpath.useNamespaces({
            'main': exports.NS_XHTML
        }).apply(xpath, Array.prototype.slice.call(arguments, 0));
    };
})();