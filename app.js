var path = require('path');
var EpubCfiGenerator = require('./epub-cfi-generator');

(function () {
    'use strict';

    var epubPath = process.argv[2] || path.join(__dirname, 'testbooks', 'accessible_epub_3.epub');

    new EpubCfiGenerator().parse(epubPath, true).then(function () {
        console.log('done');
    }, function () {
        console.log('error occurred, args: %s', JSON.stringify(arguments));
    });

}());
