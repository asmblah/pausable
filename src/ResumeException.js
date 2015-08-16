/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var util = require('util');

function ResumeException(error) {
    this.error = error;
}

util.inherits(ResumeException, Error);

module.exports = ResumeException;
