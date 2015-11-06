var fs = require('fs');
var path = require('path');
var xmldom = require('xmldom');
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
            throw `Ambiguous nodes, size: ${nodes.length}`;
        }
        return nodes[0];
    }

    function getPackageFilePath(epubPath) {
        return new Promise(function (resolve, reject) {
            var filePath = path.join(epubPath, 'META-INF/container.xml');
            fs.readFile(filePath, 'utf8', function (err, data) {
                try {
                    if (err) {
                        throw `Error reading container.xml file ${filePath}: ${err}`;
                    }

                    resolve(path.join(epubPath, validateSingleNode(xpathUtils.nsXPath(xpathUtils.NS_CONTAINER, '//main:rootfile',
                        domParser.parseFromString(data))).getAttribute('full-path')));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    function getSpinesInfo(packageFilePath) {
        var rootDir = path.dirname(packageFilePath);

        return new Promise(function (resolve, reject) {
            fs.readFile(packageFilePath, 'utf8', function (err, data) {
                try {
                    if (err) {
                        throw `Error reading package file ${packageFilePath}: ${err}`;
                    }

                    var doc = domParser.parseFromString(data);
                    var itemrefs = xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC, '//main:spine//main:itemref', doc);
                    //console.log(`spines found: ${itemrefs.length}`);

                    resolve(itemrefs.map(function (itemref) {
                        var item = validateSingleNode(xpathUtils.nsXPath(xpathUtils.NS_PACKAGE_DOC,
                                `//main:item[@id="${itemref.getAttribute('idref')}"]`, doc));

                        return {
                            idref: itemref.getAttribute('idref'),
                            href: item.getAttribute('href'),
                            path: `${rootDir}/${item.getAttribute('href')}`
                        };
                    }));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    function getSpineNodesCfi(spineFilePath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(spineFilePath, 'utf8', function (err, data) {
                try {
                    if (err) {
                        throw `Error reading spine file ${spineFilePath}: ${err}`;
                    }

                    var doc = domParser.parseFromString(data);

                    var textNodes = xpathUtils.htmlXPath('/main:html/main:body//text()[normalize-space()]', doc);
                    console.log(`spine file ${spineFilePath}, length: ${data.length}, number of text nodes: ${textNodes.length}`);

                    resolve(textNodes.map(function (node) {
                        var cfi = cfiGenerator.generateCharacterOffsetCFIComponent(node, null, null, null);
                        return {
                            node: node.toString(),
                            cfi: cfi
                        };
                    }));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    function EpubCfiGenerator() {
        if (!(this instanceof EpubCfiGenerator)) {
            return new EpubCfiGenerator();
        }
    }

    EpubCfiGenerator.prototype.parse = function (inputPath) {
        return new Promise(function (resolve, reject) {
            fs.lstat(inputPath, function (err, stats) {
                if (!err) {
                    resolve(stats);
                } else {
                    reject(err);
                }
            });
        }).then(function (stats) {
            if (!stats.isDirectory()) {
                console.time('zipExtract');
                tmp.setGracefulCleanup();
                var tmpDirObj = tmp.dirSync({});
                var zip = new AdmZip(inputPath);
                zip.extractAllTo(tmpDirObj.name.toString(), true);
                console.timeEnd('zipExtract');

                return tmpDirObj.name;
            } else {
                return inputPath;
            }
        }).then(getPackageFilePath).then(function (packageFilePath) {
            return getSpinesInfo(packageFilePath);
        }).then(function (spinesInfo) {
            //console.log('### spinesInfo: %o', JSON.stringify(spinesInfo));
            return Promise.all(spinesInfo.map(function (spineInfo) {
                return getSpineNodesCfi(spineInfo.path).then(function (nodes) {
                    //console.log('### path: %o, nodes: %o', spineInfo.path, JSON.stringify(nodes));
                    spineInfo.content = nodes;
                    delete spineInfo.path;
                });
            })).then(() => spinesInfo);
        });
    };

    module.exports = EpubCfiGenerator;
})();