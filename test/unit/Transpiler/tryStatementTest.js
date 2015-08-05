/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var escodegen = require('escodegen'),
    esprima = require('esprima'),
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    Transpiler = require('../../../src/Transpiler');

describe('Resumable Transpiler try {...} catch (...) {...} statement', function () {
    var transpiler;

    beforeEach(function () {
        transpiler = new Transpiler();
    });

    it('should correctly transpile when try and catch each contain one statement', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} catch (e) {
    c = 3;
}
d = 4;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                a = 1;
                statementIndex = 1;
            case 1:
                statementIndex = 2;
            case 2:
            case 3:
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                        break;
                    case 3:
                        throw temp0;
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        throw e;
                    }
                    switch (statementIndex) {
                    case 3:
                        c = 3;
                        statementIndex = 4;
                    }
                }
                statementIndex = 4;
            case 4:
                d = 4;
                statementIndex = 5;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {},
                    catches: {
                        3: {
                            from: 2,
                            to: 2,
                            param: 'temp0'
                        }
                    },
                    temp0: temp0
                });
            }
            throw e;
        }
    }.call(this);
});
EOS
*/;}), // jshint ignore:line
            ast = esprima.parse(inputJS);

        ast = transpiler.transpile(ast);

        expect(escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            }
        })).to.equal(expectedOutputJS);
    });

    it('should correctly transpile when try and catch each contain two statements', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
    c = 3;
} catch (e) {
    d = 4;
    e = 5;
}
f = 6;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                a = 1;
                statementIndex = 1;
            case 1:
                statementIndex = 2;
            case 2:
            case 3:
            case 4:
            case 5:
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                    case 3:
                        c = 3;
                        statementIndex = 4;
                        break;
                    case 4:
                    case 5:
                        throw temp0;
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        throw e;
                    }
                    switch (statementIndex) {
                    case 4:
                        d = 4;
                        statementIndex = 5;
                    case 5:
                        e = 5;
                        statementIndex = 6;
                    }
                }
                statementIndex = 6;
            case 6:
                f = 6;
                statementIndex = 7;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {},
                    catches: {
                        4: {
                            from: 2,
                            to: 3,
                            param: 'temp0'
                        }
                    },
                    temp0: temp0
                });
            }
            throw e;
        }
    }.call(this);
});
EOS
*/;}), // jshint ignore:line
            ast = esprima.parse(inputJS);

        ast = transpiler.transpile(ast);

        expect(escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            }
        })).to.equal(expectedOutputJS);
    });
});
