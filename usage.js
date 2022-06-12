const fs = require('fs');
const EpubCfiGenerator = require('./epub-cfi-generator');

(() => {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  if (!inputFile || !outputFile) {
    console.log('usage: node usage <input_epub_file> <output_json_file>');
    return;
  }

  new EpubCfiGenerator().parse(inputFile).then((spinesInfo) => {
    const serialized = JSON.stringify(spinesInfo, null, 4);
    console.log(`result data length: ${serialized.length}`);
    fs.writeFileSync(outputFile, serialized);
  }).catch((err) => console.error(`${err}\x07`));
})();
