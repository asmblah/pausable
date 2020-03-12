# Pausable

[![Build Status](https://secure.travis-ci.org/asmblah/pausable.png?branch=master)](https://travis-ci.org/asmblah/pausable)

Pause and resume JavaScript code from arbitrary points.

## Installation

```shell script
$ npm install pausable
```

## Usage

```javascript
let pausable = require('pausable');
```

### Execute code where the top level can pause

```javascript
(async () => {
    let myResult = await pausable.execute(`
// Pause at this point for 4 seconds, after which
// myVar should be assigned the value "my string"
var myVar = giveMeAfter('my string', 4000);

return myVar + ' with something appended';
`, {
    expose: {
        giveMeAfter(value, milliseconds) {
            var pause = pausable.createPause();

            setTimeout(() => {
                // Timeout has elapsed, so we can resume the paused code
                pause.resume(value);
            }, milliseconds);

            // Do the pause
            pause.now();
        }
    }
});

    console.log(myResult);
})();
```

Output:
```
my string with something appended
```
