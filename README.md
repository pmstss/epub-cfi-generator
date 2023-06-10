# epub-cfi-generator

[Node.js](https://nodejs.org/) utility that generates [CFI](http://www.idpf.org/epub/linking/cfi/epub-cfi.html) for each text node in each spine of given [EPUB](http://idpf.org/epub).  
Takes EPUB file as input (either epub file or unzipped epub directory), produces json file as output.  
Internally uses [readium-cfi-js](https://github.com/readium/readium-cfi-js) that does most job.

## Usage

### Command line

```sh
npx epub-cfi-generator input.epub output.json
```

### Examples

#### Input

Reference EPUB (close to https://idpf.org/epub/linking/cfi/#sec-path-examples)

<details>
<summary>package.opf</summary>

```xml
<?xml version="1.0"?>
<package version="2.0"
         unique-identifier="bookid"
         xmlns="http://www.idpf.org/2007/opf"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:opf="http://www.idpf.org/2007/opf">

    <metadata>
        <dc:title>Test EPUB</dc:title>
        <dc:identifier id="bookid">some-book-id</dc:identifier>
        <dc:creator>Viachaslau Tyshkavets</dc:creator>
        <dc:language>en</dc:language>
    </metadata>

    <manifest>
        <item id="test" href="html/test.xhtml" media-type="application/xhtml+xml"/>
    </manifest>

    <spine>
        <itemref id="testref"  idref="test"/>
    </spine>

</package>
```
</details>

<details>
<summary>test.xhtml</summary>

```xml
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>Title</title>
    </head>

    <body id="body01">
        <p>1</p>
        <p>2</p>
        <p>3</p>
        <p>4</p>
        <p id="para05">xxx<em>yyy</em>0123456789</p>
        <p>6</p>
        <p>7</p>
        <img id="svgimg" src="foo.svg" alt="image"/>
        <p>8</p>
        <p>9</p>
    </body>
</html>
```
</details>

#### Output:

<details>
<summary>Output json</summary>

```json
[
  {
    "idref": "test",
    "href": "html/test.xhtml",
    "content": [
      {
        "node": "1",
        "cfi": "/6/2[testref]!/4[body01]/2/1:0"
      },
      {
        "node": "2",
        "cfi": "/6/2[testref]!/4[body01]/4/1:0"
      },
      {
        "node": "3",
        "cfi": "/6/2[testref]!/4[body01]/6/1:0"
      },
      {
        "node": "4",
        "cfi": "/6/2[testref]!/4[body01]/8/1:0"
      },
      {
        "node": "xxx",
        "cfi": "/6/2[testref]!/4[body01]/10[para05]/1:0"
      },
      {
        "node": "yyy",
        "cfi": "/6/2[testref]!/4[body01]/10[para05]/2/1:0"
      },
      {
        "node": "0123456789",
        "cfi": "/6/2[testref]!/4[body01]/10[para05]/3:0"
      },
      {
        "node": "6",
        "cfi": "/6/2[testref]!/4[body01]/12/1:0"
      },
      {
        "node": "7",
        "cfi": "/6/2[testref]!/4[body01]/14/1:0"
      },
      {
        "node": "8",
        "cfi": "/6/2[testref]!/4[body01]/18/1:0"
      },
      {
        "node": "9",
        "cfi": "/6/2[testref]!/4[body01]/20/1:0"
      }
    ]
  }
]
```

</details>

### API

#### EpubCfiGenerator.parse()

```js
const EpubCfiGenerator = require('./epub-cfi-generator');
const result = await new EpubCfiGenerator().parse(inputFile);
```

License
----
MIT
