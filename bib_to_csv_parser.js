var fs = require('fs');

var objects = [];
var currentLine = 0;
const delimiter = '|'
const inputFileName = './Primo_BibTeX_Export.bib'
const outputFileName = 'output_' + Date.now() + '.csv'
const chosen_properties = ['abstract', 'title', 'year', 'author'];

try {
    console.log('loading ' + inputFileName + ' ...')
    const data = fs.readFileSync(inputFileName, 'UTF-8')
    const lines = data.toString().split(/\r?\n/);
    const lineCount = lines.length;

    console.log('parsing ' + inputFileName + ' ...')
    while (currentLine < lineCount) { // goes through all lines in input.bib
        if (lines[currentLine][0] === '@') {
            var currentObject = []
            while (lines[currentLine] !== '}') {
                var line = lines[currentLine]
                if (line.substr(-2) === '},') {
                    currentObject.push(lines[currentLine])
                    currentLine++;
                }
                else {
                    var concatonatedObj = '';
                    while (lines[currentLine].substr(-2) !== '},') {
                        concatonatedObj += lines[currentLine]
                        currentLine++;
                    }
                    concatonatedObj += lines[currentLine];
                    currentLine++;
                    currentObject.push(concatonatedObj);
                }
            }
            currentObject.push(lines[currentLine])
            objects.push(currentObject)
        }
        currentLine++;
    }
    var converted = objects.map(object => {
        var keys = chosen_properties;
        var keyValuePair = keys.map(key => {
            return [key, filterTest(object, key.toString().toLocaleLowerCase())];
        })

        return Object.fromEntries(keyValuePair);
    })

    console.log('saving ' + inputFileName + ' to ' + outputFileName + '...')

    checkForFile(outputFileName, () => {
        var logger = fs.createWriteStream(outputFileName, {
            flags: 'a' // 'a' means appending (old data will be preserved)
        })

        logger.write(chosen_properties.map(property => property[0].toLocaleUpperCase() + property.substr(1)).join(delimiter) + '\n')

        converted.forEach(ref => {
            logger.write(Object.values(ref).join(delimiter) + "\n");
        });
    })
} catch (error) {
    console.log(error);
}

// checks if file exists, if not creates file
function checkForFile(fileName, callback) {
    fs.stat(fileName, function (exists) {
        if (exists) {
            callback();
        } else {
            fs.writeFile(fileName, { flag: 'wx' }, function (err, data) {
                callback();
            })
        }
    });
}

// returns (from parsed object, the value of that search param)
// if filtering for 'abstract' returns the value of abstract within passed object
// or ' ' if abstract was not found
function filterTest(object, searchParam) {
    var linesThatFit = object.filter(line => {
        return line.toString().toLowerCase().substring(0, searchParam.length + 1)
            .includes(searchParam.toString().toLowerCase());
    })

    var returnString = linesThatFit.map(line => {
        var firstIndex = line.indexOf('{') + 1;
        var lastIndexOf = line.lastIndexOf('}')
        return line.substring(firstIndex, lastIndexOf === -1 ? firstIndex : lastIndexOf)
    })

    return returnString.length === 1 ? returnString[0].toString() : ""
}
