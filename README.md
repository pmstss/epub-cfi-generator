# epub-cfi-generator

[Node.js](https://nodejs.org/) utility that generates [CFI](http://www.idpf.org/epub/linking/cfi/epub-cfi.html) for each text node in each spine of given [EPUB](http://idpf.org/epub).  
Takes EPUB as input (either epub file or unzipped epub directory), produces json file as output.  
Internally uses [readium-cfi-js](https://github.com/readium/readium-cfi-js) that does most job.

## Usage
### Command line

```sh
$ git clone https://github.com/pmstss/epub-cfi-generator
$ cd epub-cfi-generator
$ npm install
$ node usage.js <input_epub_file> <output_json_file>
```

Sample output:

```js
[
    {
        "idref": "cover",
        "href": "cover.xhtml",
        "content": []
    },
        {
        "idref": "chapter285",
        "href": "chapter285.xhtml",
        "content": [
            {
                "node": "Physicians and Surgeons, All Other",
                "cfi": "/4/2[hid398]/2/1:0"
            },
            {
                "node": "All physicians and surgeons not listed separately.",
                "cfi": "/4/4/1:0"
            },
            {
                "node": "Annual Earnings. Average: ",
                "cfi": "/4/6/2/1:0"
            },
            {
                "node": "No data available. ",
                "cfi": "/4/6/1:0"
            }
        ]
    }
]
```

### API

See [usage.js](usage.js)

```js
var EpubCfiGenerator = require('./epub-cfi-generator');
new EpubCfiGenerator().parse(inputFile).then(...)
```

License
----
MIT
