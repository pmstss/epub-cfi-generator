/*jshint quotmark: false*/


(function () {
    'use strict';

    var xpathUtils = require('./xpathUtils.js');
    var EPUBcfi = require('./runtime_errors');
    EPUBcfi.CFIInstructions = require('./cfi_instructions').CFIInstructions;

    EPUBcfi.Generator = {

        // ------------------------------------------------------------------------------------ //
        //  Validators                                                                          //
        // ------------------------------------------------------------------------------------ //

        validateStartTextNode: function (startTextNode, characterOffset) {
            // Check that the text node to start from IS a text node
            if (!startTextNode) {
                throw new EPUBcfi.NodeTypeError(startTextNode,
                    "Cannot generate a character offset from a starting point that is not a text node");
            } else if (startTextNode.nodeType !== 3) {
                throw new EPUBcfi.NodeTypeError(startTextNode,
                    "Cannot generate a character offset from a starting point that is not a text node");
            }

            // Check that the character offset is within a valid range for the text node supplied
            if (characterOffset < 0) {
                throw new EPUBcfi.OutOfRangeError(characterOffset, 0, "Character offset cannot be less than 0");
            } else if (characterOffset > startTextNode.nodeValue.length) {
                throw new EPUBcfi.OutOfRangeError(characterOffset, startTextNode.nodeValue.length - 1,
                    "character offset cannot be greater than the length of the text node");
            }
        },

        validateStartElement: function (startElement) {
            if (!startElement) {
                throw new EPUBcfi.NodeTypeError(startElement, "CFI target element is undefined");
            }

            if (!(startElement.nodeType && startElement.nodeType === 1)) {
                throw new EPUBcfi.NodeTypeError(startElement, "CFI target element is not an HTML element");
            }
        },

        validateContentDocumentName: function (contentDocumentName) {
            // Check that the idref for the content document has been provided
            if (!contentDocumentName) {
                throw new Error("The idref for the content document, as found in the spine, must be supplied");
            }
        },

        validatePackageDocument: function (packageDocument, contentDocumentName) {
            // Check that the package document is non-empty and contains an itemref element for the supplied idref
            if (!packageDocument) {
                throw new Error("A package document must be supplied to generate a CFI");
            } else if (xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC,
                    '//main:itemref[@idref="' + contentDocumentName + '"]', packageDocument).length === 0) {
                throw new Error("The idref of the content document could not be found in the spine");
            }
        },

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        // Description: Generates a character offset CFI
        // Arguments: The text node that contains the offset referenced by the cfi, the offset value, the name of the
        //   content document that contains the text node, the package document for this EPUB.
        generateCharacterOffsetCFIComponent: function (startTextNode, characterOffset, classBlacklist, elementBlacklist,
            idBlacklist) {

            var textNodeStep;
            var contentDocCFI;

            this.validateStartTextNode(startTextNode, characterOffset);

            // Create the text node step
            textNodeStep = this.createCFITextNodeStep(startTextNode, characterOffset, classBlacklist, elementBlacklist,
                idBlacklist);

            // Call the recursive method to create all the steps up to the head element of the content document (the "html" element)
            contentDocCFI = this.createCFIElementSteps(startTextNode.parentNode, "html", classBlacklist,
                elementBlacklist, idBlacklist) + textNodeStep;
            return contentDocCFI.substring(1, contentDocCFI.length);
        },

        generateElementCFIComponent: function (startElement, classBlacklist, elementBlacklist, idBlacklist) {
            this.validateStartElement(startElement);

            // Call the recursive method to create all the steps up to the head element of the content document (the "html" element)
            var contentDocCFI = this.createCFIElementSteps(startElement, "html", classBlacklist, elementBlacklist,
                idBlacklist);

            // Remove the !
            return contentDocCFI.substring(1, contentDocCFI.length);
        },

        generatePackageDocumentCFIComponent: function (contentDocumentName, packageDocument, classBlacklist,
            elementBlacklist, idBlacklist) {

            this.validateContentDocumentName(contentDocumentName);
            this.validatePackageDocument(packageDocument, contentDocumentName);

            // Get the start node (itemref element) that references the content document
            var itemRefStartNode = xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC,
                    '//main:itemref[@idref="' + contentDocumentName + '"]', packageDocument)[0];

            // Create the steps up to the top element of the package document (the "package" element)
            var packageDocCFIComponent = this.createCFIElementSteps(itemRefStartNode, "package", classBlacklist,
                elementBlacklist, idBlacklist);

            // Append an !; this assumes that a CFI content document CFI component will be appended at some point
            return packageDocCFIComponent + "!";
        },

        generatePackageDocumentCFIComponentWithSpineIndex: function (spineIndex, packageDocument, classBlacklist,
            elementBlacklist, idBlacklist) {

            // Get the start node (itemref element) that references the content document
            var itemRefStartNode = xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC, '//spine[' + spineIndex + ']')[0];

            // Create the steps up to the top element of the package document (the "package" element)
            var packageDocCFIComponent = this.createCFIElementSteps(itemRefStartNode, "package", classBlacklist,
                elementBlacklist, idBlacklist);

            // Append an !; this assumes that a CFI content document CFI component will be appended at some point
            return packageDocCFIComponent + "!";
        },

        generateCompleteCFI: function (packageDocumentCFIComponent, contentDocumentCFIComponent) {
            return "epubcfi(" + packageDocumentCFIComponent + contentDocumentCFIComponent + ")";
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        // Description: Creates a CFI terminating step to a text node, with a character offset
        // REFACTORING CANDIDATE: Some of the parts of this method could be refactored into their own methods
        createCFITextNodeStep: function (startTextNode, characterOffset, classBlacklist, elementBlacklist,
            idBlacklist) {
            // Find text node position in the set of child elements, ignoring any blacklisted elements
            var parentNode = startTextNode.parentNode;

            var nodes = EPUBcfi.CFIInstructions.applyBlacklist(xpathUtils.htmlXPath('node()', parentNode),
                classBlacklist, elementBlacklist, idBlacklist);

            // Find the text node index in the parent list, inferring nodes that were originally a single text node
            var prevNodeWasTextNode;
            var indexOfFirstInSequence;
            var textNodeOnlyIndex = 0;
            var characterOffsetSinceUnsplit = 0;
            var finalCharacterOffsetInSequence = 0;
            var indexOfTextNode = 0;
            nodes.forEach(function (node) {
                // If this is a text node, check if it matches and return the current index
                if (node.nodeType === 3) {
                    if (node === startTextNode) {
                        // Set index as the first in the adjacent sequence of text nodes, or as the index of the current node if this
                        //   node is a standard one sandwiched between two element nodes.
                        if (prevNodeWasTextNode) {
                            indexOfTextNode = indexOfFirstInSequence;
                            finalCharacterOffsetInSequence = characterOffsetSinceUnsplit;
                        } else {
                            indexOfTextNode = textNodeOnlyIndex;
                        }

                        // Break out of .each loop
                        return false;
                    }

                    // Save this index as the first in sequence of adjacent text nodes, if it is not already set by this point
                    prevNodeWasTextNode = true;
                    characterOffsetSinceUnsplit = characterOffsetSinceUnsplit + node.toString().length;
                    if (indexOfFirstInSequence === undefined) {
                        indexOfFirstInSequence = textNodeOnlyIndex;
                        textNodeOnlyIndex = textNodeOnlyIndex + 1;
                    }
                } else {
                    // This node is not a text node
                    prevNodeWasTextNode = false;
                    indexOfFirstInSequence = undefined;
                    characterOffsetSinceUnsplit = 0;
                }
            });

            // Convert the text node index to a CFI odd-integer representation
            var CFIIndex = (indexOfTextNode * 2) + 1;

            // Return the constructed CFI text node step
            return "/" + CFIIndex + ":" + (finalCharacterOffsetInSequence + characterOffset);
        },

        createCFIElementSteps: function (currNode, topLevelElementName, classBlacklist, elementBlacklist, idBlacklist) {
            // Find position of current node in parent list
            var currNodePosition;
            var blacklistExcluded = EPUBcfi.CFIInstructions.applyBlacklist(xpathUtils.htmlXPath('*', currNode.parentNode), classBlacklist,
                elementBlacklist, idBlacklist);
            for (var i = 0; i < blacklistExcluded.length; ++i) {
                if (blacklistExcluded[i] === currNode) {
                    currNodePosition = i;
                    break;
                }
            }
            //var currNodePosition = xpathUtils.htmlXPath('count(preceding-sibling::*)', currNode);

            // Convert position to the CFI even-integer representation
            var CFIPosition = (currNodePosition + 1) * 2;

            // Create CFI step with id assertion, if the element has an id
            var id = currNode.getAttribute('id');
            var elementStep = "/" + CFIPosition + (id ? "[" + id + "]" : '');

            // If a parent is an html element return the (last) step for this content document, otherwise, continue.
            //   Also need to check if the current node is the top-level element. This can occur if the start node is also the
            //   top level element.
            var parentNode = currNode.parentNode;
            if (parentNode.localName === topLevelElementName || currNode.localName === topLevelElementName) {

                // If the top level node is a type from which an indirection step, add an indirection step character (!)
                // REFACTORING CANDIDATE: It is possible that this should be changed to: if (topLevelElement = 'package') do
                //   not return an indirection character. Every other type of top-level element may require an indirection
                //   step to navigate to, thus requiring that ! is always prepended.
                if (topLevelElementName === 'html') {
                    return "!" + elementStep;
                } else {
                    return elementStep;
                }
            } else {
                return this.createCFIElementSteps(parentNode, topLevelElementName, classBlacklist, elementBlacklist,
                    idBlacklist) + elementStep;
            }
        }
    };

    exports.Generator = EPUBcfi.Generator;
}());