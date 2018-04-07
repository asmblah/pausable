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

describe('Resumable Transpiler call expression', function () {
    var transpiler;

    beforeEach(function () {
        transpiler = new Transpiler();
    });

    it('should correctly transpile a function call', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
doSomething();
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
                temp0 = doSomething;
                statementIndex = 1;
            case 1:
                Resumable.checkCallable('doSomething', temp0), temp0();
                statementIndex = 2;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: { '0': 'temp0' },
                    temp0: temp0
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile an assignment of method call result to property', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = tools.getOne();
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = tools;
                statementIndex = 2;
            case 2:
                temp2 = temp1.getOne;
                statementIndex = 3;
            case 3:
                temp3 = (Resumable.checkCallable('tools.getOne', temp2), temp2.call(temp1));
                statementIndex = 4;
            case 4:
                temp0.result = temp3;
                statementIndex = 5;
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
                        '3': 'temp3'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile an assignment of method call result to property when call has variable argument', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = tools.getOne(myVar);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            temp4 = Resumable._resumeState_.temp4;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = tools;
                statementIndex = 2;
            case 2:
                temp2 = temp1.getOne;
                statementIndex = 3;
            case 3:
                temp3 = myVar;
                statementIndex = 4;
            case 4:
                temp4 = (Resumable.checkCallable('tools.getOne', temp2), temp2.call(temp1, temp3));
                statementIndex = 5;
            case 5:
                temp0.result = temp4;
                statementIndex = 6;
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
                        '4': 'temp4'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile each argument passed in a function call', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = sum(a + 1, b + 2);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            temp4 = Resumable._resumeState_.temp4;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = sum;
                statementIndex = 2;
            case 2:
                temp2 = a;
                statementIndex = 3;
            case 3:
                temp3 = b;
                statementIndex = 4;
            case 4:
                temp4 = (Resumable.checkCallable('sum', temp1), temp1(temp2 + 1, temp3 + 2));
                statementIndex = 5;
            case 5:
                temp0.result = temp4;
                statementIndex = 6;
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
                        '4': 'temp4'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile a call to a method of a property', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = first.second.third();
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            temp4 = Resumable._resumeState_.temp4;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = first;
                statementIndex = 2;
            case 2:
                temp2 = temp1.second;
                statementIndex = 3;
            case 3:
                temp3 = temp2.third;
                statementIndex = 4;
            case 4:
                temp4 = (Resumable.checkCallable('first.second.third', temp3), temp3.call(temp2));
                statementIndex = 5;
            case 5:
                temp0.result = temp4;
                statementIndex = 6;
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
                        '4': 'temp4'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile a call to method of local variable', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
var obj = {};

result = obj.method();
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, obj, temp0, temp1;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                obj = {};
                statementIndex = 1;
            case 1:
                temp0 = obj.method;
                statementIndex = 2;
            case 2:
                temp1 = (Resumable.checkCallable('obj.method', temp0), temp0.call(obj));
                statementIndex = 3;
            case 3:
                result = temp1;
                statementIndex = 4;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '1': 'temp0',
                        '2': 'temp1'
                    },
                    temp0: temp0,
                    temp1: temp1
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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

    it('should correctly transpile calling method on return value then method on that return value', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = getMyObject('using these', 'args')
    .first()
    .second();
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4, temp5, temp6;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            temp3 = Resumable._resumeState_.temp3;
            temp4 = Resumable._resumeState_.temp4;
            temp5 = Resumable._resumeState_.temp5;
            temp6 = Resumable._resumeState_.temp6;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = getMyObject;
                statementIndex = 2;
            case 2:
                temp2 = (Resumable.checkCallable('getMyObject', temp1), temp1('using these', 'args'));
                statementIndex = 3;
            case 3:
                temp3 = temp2.first;
                statementIndex = 4;
            case 4:
                temp4 = (Resumable.checkCallable('getMyObject(...).first', temp3), temp3.call(temp2));
                statementIndex = 5;
            case 5:
                temp5 = temp4.second;
                statementIndex = 6;
            case 6:
                temp6 = (Resumable.checkCallable('getMyObject(...).first(...).second', temp5), temp5.call(temp4));
                statementIndex = 7;
            case 7:
                temp0.result = temp6;
                statementIndex = 8;
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
                        '5': 'temp5',
                        '6': 'temp6'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4,
                    temp5: temp5,
                    temp6: temp6
                });
            }
            throw e;
        }
    }.apply(this, arguments);
});
EOS
*/;}), // jshint ignore:line
            ast = acorn.parse(inputJS);

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
