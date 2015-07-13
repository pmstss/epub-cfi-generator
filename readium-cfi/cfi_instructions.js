// Description: This model contains the implementation for "instructions" included in the EPUB CFI domain specific language (DSL).
//   Lexing and parsing a CFI produces a set of executable instructions for processing a CFI (represented in the AST). 
//   This object contains a set of functions that implement each of the executable instructions in the AST. 

(function () {
    'use strict';

    var EPUBcfi = {};

    EPUBcfi.CFIInstructions = {
        applyBlacklist: function (elements, classBlacklist, elementBlacklist, idBlacklist) {
            return elements.filter(function (element) {
                return EPUBcfi.CFIInstructions.isInBlackList(element, classBlacklist, elementBlacklist, idBlacklist);
            });
        },

        isInBlackList: function (element, classBlacklist, elementBlacklist, idBlacklist) {
            var i;

            if (classBlacklist) {
                var classes = (element.getAttribute('class') || '').split(' ').map(function (className) {
                    return className.trim();
                });
                for (i = 0; i < classBlacklist.length; ++i) {
                    if (classes.indexOf(classBlacklist[i]) !== -1) {
                        return false;
                    }
                }
            }

            if (elementBlacklist) {
                for (i = 0; i < elementBlacklist.length; ++i) {
                    if (element === elementBlacklist[i]) {
                        return false;
                    }
                }
            }

            if (idBlacklist) {
                for (i = 0; i < idBlacklist.length; ++i) {
                    if (element.getAttribute('id') === idBlacklist[i]) {
                        return false;
                    }
                }
            }

            return true;
        }
    };

    exports.CFIInstructions = EPUBcfi.CFIInstructions;
}());


