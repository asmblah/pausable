/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    pausable = require('../..'),
    Resumable = require('../../src/Resumable');

describe('Public API', function () {
    it('should export an instance of Resumable', function () {
        expect(pausable).to.be.an.instanceOf(Resumable);
    });
});
