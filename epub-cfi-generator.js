var fs = require('fs');
var path = require('path');
var xmldom = require('xmldom');
var RSVP = require('rsvp');
var AdmZip = require('adm-zip');
var tmp = require('tmp');

var xpathUtils = require('./readium-cfi/xpathUtils.js');
var cfiGenerator = require('./readium-cfi/cfi_generator').Generator;

(function () {
    'use strict';

    var domParser = new xmldom.DOMParser();

    function validateSingleNode(nodes) {
        if (nodes.length !== 1) {
            nodes.forEach(console.log);
            throw 'Ambiguous nodes, size: ' + nodes.length;
        }
        return nodes[0];
    }

    function getPackageFilePath(epubPath) {
        return new RSVP.Promise(function (resolve, reject) {
            var filePath = path.join(epubPath, 'META-INF/container.xml');
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (err) {
                    reject('Error reading package file: ' + filePath);
                    return;
                }

                resolve(validateSingleNode(xpathUtils.nsXPath(xpathUtils.NS_CONTAINER, '//main:rootfile',
                    domParser.parseFromString(data))).getAttribute('full-path'));
            });
        });
    }

    function getSpinesInfo(packageFilePath) {
        var rootDir = path.dirname(packageFilePath);

        return new RSVP.Promise(function (resolve, reject) {
            fs.readFile(packageFilePath, 'utf8', function (err, data) {
                if (err) {
                    reject('Error reading package file: ' + packageFilePath);
                    return;
                }

                var doc = domParser.parseFromString(data);
                var itemrefs = xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC, '//main:spine//main:itemref', doc);
                console.log('spines found: %d', itemrefs.length);

                resolve(itemrefs.map(function (itemref) {
                    var item = validateSingleNode(xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC,
                            '//main:item[@id="' + itemref.getAttribute('idref') + '"]', doc));

                    return {
                        idref: itemref.getAttribute('idref'),
                        href: item.getAttribute('href'),
                        path: rootDir + '/' + item.getAttribute('href')
                    };
                }));
            });
        });
    }

    function getSpineNodesCfi(spineFilePath) {
        return new RSVP.Promise(function (resolve, reject) {
            fs.readFile(spineFilePath, 'utf8', function (err, data) {
                if (err) {
                    reject('Error reading spine file: ' + spineFilePath);
                    return;
                }

                var doc = domParser.parseFromString(data);

                var textNodes = xpathUtils.htmlXPath('/main:html/main:body//text()[normalize-space()]', doc);
                console.log('spine file %s, length: %d, number of text nodes: %d', spineFilePath, data.length,
                    textNodes.length);

                resolve(textNodes.map(function (node) {
                    var cfi = cfiGenerator.generateCharacterOffsetCFIComponent(node, null, null, null);
                    return {
                        node: node.toString(),
                        cfi: cfi
                    };
                }));
            });
        });
    }

    function EpubCfiGenerator() {

    }

    //TODO check errors handling
    EpubCfiGenerator.prototype.parse = function (inputPath, writeToFile) {
        var pathInfo = (function () {
            var isDirectory = fs.lstatSync(inputPath).isDirectory();

            var zipAwareInputPath;
            if (!isDirectory) {
                console.time('zipExtract');
                tmp.setGracefulCleanup();
                var tmpDirObj = tmp.dirSync({});
                var zip = new AdmZip(inputPath);
                zip.extractAllTo(tmpDirObj.name.toString(), true);
                console.timeEnd('zipExtract');

                zipAwareInputPath = tmpDirObj.name;
            } else {
                zipAwareInputPath = inputPath;
            }

            var outDirPath = isDirectory ? path.join(inputPath, '..') : path.dirname(inputPath);
            var outFilePath = path.join(outDirPath, path.basename(inputPath) + '.json');
            return {
                inputPath: zipAwareInputPath,
                outFilePath: outFilePath
            };
        })();
        console.log('pathInfo: %s', JSON.stringify(pathInfo));

        return new RSVP.Promise(function (resolve, reject) {
            getPackageFilePath(pathInfo.inputPath).then(function (packageFilePath) {
                return getSpinesInfo(path.join(pathInfo.inputPath, packageFilePath));
            }, reject).then(function (spinesInfo) {
                return RSVP.all(spinesInfo.map(function (spineInfo) {
                    return getSpineNodesCfi(spineInfo.path).then(function (nodes) {
                        spineInfo.content = nodes;
                        delete spineInfo.path;
                    }, reject);
                })).then(function () {
                    return spinesInfo;
                }, reject);
            }, reject).then(function (spinesInfo) {
                if (writeToFile) {
                    var serialized = JSON.stringify(spinesInfo, null, 4);
                    console.log('result data length: %d', serialized.length);
                    fs.writeFileSync(pathInfo.outFilePath, serialized);
                }
                resolve(spinesInfo);
            }, reject);
        });
    };

    module.exports = EpubCfiGenerator;
})();