/* eslint-disable */
/* jshint ignore:start */

const EpubCfiGenerator = require('./epub-cfi-generator');
const expected = require('./testbooks/minimal-output.json');

test('EpubCfiGenerator.parse()', async () => {
  // Arrange
  const epubCfiGenerator = new EpubCfiGenerator();

  // Act
  const res = await epubCfiGenerator.parse('./testbooks/minimal.epub');

  // Assert
  expect(res).toEqual(expected);
});
