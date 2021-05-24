var fs = require('fs');




fixFiles(['./proquest_query1.bib', './proquest_query2.bib',
    './acm_query1.bib', './acm_query2.bib'])

function fixFiles(fileNames) {
    fileNames.forEach(inputFileName => {
        const outputFileName = inputFileName.substr(0, inputFileName.length - 4) + '_fixed' + '.bib'
        var objects = [];
        var currentLine = 0;
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
                        currentObject.push(lines[currentLine].replace(/%/g, "percent").replace(/&/g, "\&"))
                        currentLine++;
                    }
                    currentObject.push(lines[currentLine].replace(/%/g, "percent").replace(/&/g, "\&"))

                    objects.push(currentObject)
                }
                currentLine++;
            }

            var converted = objects.map(object => {
                var fullObjectArr = object;
                var title = filterTest(object, "title")
                var year = filterTest(object, 'year')
                var author = filterTest(object, "author")
                var note = filterTest(object, 'note')

                if (author == "") {
                    fullObjectArr[0] = fullObjectArr[0].split("{")[0] + "{" +
                        title.split(" ").slice(0, 2).join("").replace(/,/g, "") +
                        year +
                        ","
                } else {
                    fullObjectArr[0] = fullObjectArr[0].split("{")[0] + "{" +
                        author.split(" ").slice(0, 1).join("").replace(/,/g, "") +
                        year +
                        ","
                }

                if (note) {
                    // console.log(note)
                    fullObjectArr.forEach((property, index) => {
                        if (property.includes(note)) {
                            delete fullObjectArr[index];
                            return;
                        }
                            
                    })
                    // console.log(fullObjectArr.indexOf(note))
                    // console.log(fullObjectArr[fullObjectArr.indexOf(note)])
                    // delete fullObjectArr[fullObjectArr.indexOf(note)]
                }
                return fullObjectArr;
            })

            // console.log(objects[0])

            console.log('saving ' + inputFileName + ' to ' + outputFileName + '...')

            checkForFile(outputFileName, () => {
                var logger = fs.createWriteStream(outputFileName, {
                    flags: 'a' // 'a' means appending (old data will be preserved)
                })


                converted.forEach(obj => {
                    Object.values(obj).forEach(line => {
                        logger.write(line + "\n");
                    })
                    logger.write("\n");
                });
            })
        } catch (error) {
            console.log(error);
        }
    });
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
