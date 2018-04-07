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
    acorn = require('acorn'),
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    Transpiler = require('../../../src/Transpiler');

describe('Resumable Transpiler sequence statement', function () {
    var transpiler;

    beforeEach(function () {
        transpiler = new Transpiler();
    });

    it('should correctly transpile a sequence of multiple function calls', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
print(1), print(2), print(3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4, temp5;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            temp4 = Resumable._resumeState_.temp4;
            temp5 = Resumable._resumeState_.temp5;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = print;
                statementIndex = 1;
            case 1:
                temp1 = (Resumable.checkCallable('print', temp0), temp0(1));
                statementIndex = 2;
            case 2:
                temp2 = print;
                statementIndex = 3;
            case 3:
                temp3 = (Resumable.checkCallable('print', temp2), temp2(2));
                statementIndex = 4;
            case 4:
                temp4 = print;
                statementIndex = 5;
            case 5:
                temp5 = (Resumable.checkCallable('print', temp4), temp4(3));
                statementIndex = 6;
            case 6:
                temp1, temp3, temp5;
                statementIndex = 7;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '2': 'temp2',
                        '3': 'temp3',
                        '4': 'temp4',
                        '5': 'temp5'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4,
                    temp5: temp5
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS, {'allowReturnOutsideFunction': true});

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
