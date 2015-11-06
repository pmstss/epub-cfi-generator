var fs = require('fs');
var EpubCfiGenerator = require('./epub-cfi-generator');

(function () {
    'use strict';

    var inputFile = process.argv[2];
    var outputFile = process.argv[3];
    if (!inputFile || !outputFile) {
        console.log('usage: node usage <input_epub_file> <output_json_file>');
        return;
    }

    new EpubCfiGenerator().parse(inputFile).then(function (spinesInfo) {
        var serialized = JSON.stringify(spinesInfo, null, 4);
        console.log(`result data length: ${serialized.length}`);
        fs.writeFileSync(outputFile, serialized);
    }).catch(err => console.error(err + '\x07'));
})();