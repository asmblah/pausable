/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var Resumable = require('./src/Resumable'),
    Transpiler = require('./src/Transpiler');

module.exports = {
    create: function () {
        return new Resumable(new Transpiler());
    }
};
