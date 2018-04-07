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

describe('Resumable Transpiler for loop statement', function () {
    var transpiler;

    beforeEach(function () {
        transpiler = new Transpiler();
    });

    it('should correctly transpile a for loop with empty init, test and update', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
print(1);
for (;;) {
    print(2);
}
print(3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            temp0 = Resumable._resumeState_.temp0;
            temp1 = Resumable._resumeState_.temp1;
            temp2 = Resumable._resumeState_.temp2;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = print;
                statementIndex = 1;
            case 1:
                Resumable.checkCallable('print', temp0), temp0(1);
                statementIndex = 2;
            case 2:
                statementIndex = 3;
            case 3:
            case 4:
                for (;;) {
                    switch (statementIndex) {
                    case 3:
                        temp1 = print;
                        statementIndex = 4;
                    case 4:
                        Resumable.checkCallable('print', temp1), temp1(2);
                        statementIndex = 5;
                    }
                    statementIndex = 3;
                }
                statementIndex = 5;
            case 5:
                temp2 = print;
                statementIndex = 6;
            case 6:
                Resumable.checkCallable('print', temp2), temp2(3);
                statementIndex = 7;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '3': 'temp1',
                        '5': 'temp2'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2
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

    it('should correctly transpile a break out of for loop', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
print(1);
for (i = getStart(), j = 1; i < 21; i++) {
    print(2);
    break;
}
print(3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4, temp5, temp6, temp7;
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
            temp7 = Resumable._resumeState_.temp7;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = print;
                statementIndex = 1;
            case 1:
                Resumable.checkCallable('print', temp0), temp0(1);
                statementIndex = 2;
            case 2:
                temp1 = getStart;
                statementIndex = 3;
            case 3:
                temp2 = (Resumable.checkCallable('getStart', temp1), temp1());
                statementIndex = 4;
            case 4:
                i = temp2, j = 1;
                statementIndex = 5;
            case 5:
                statementIndex = 6;
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 6:
                            temp3 = i;
                            statementIndex = 7;
                        case 7:
                            if (!(temp3 < 21)) {
                                break label0;
                            }
                            statementIndex = 8;
                        case 8:
                            temp4 = print;
                            statementIndex = 9;
                        case 9:
                            Resumable.checkCallable('print', temp4), temp4(2);
                            statementIndex = 10;
                        case 10:
                            break label0;
                        case 11:
                            temp5 = i;
                            statementIndex = 12;
                        case 12:
                            temp6 = temp5 + 1;
                            statementIndex = 13;
                        case 13:
                            i = temp6;
                            statementIndex = 14;
                        case 14:
                            temp5;
                            statementIndex = 15;
                        }
                        statementIndex = 6;
                    }
                statementIndex = 15;
            case 15:
                temp7 = print;
                statementIndex = 16;
            case 16:
                Resumable.checkCallable('print', temp7), temp7(3);
                statementIndex = 17;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '2': 'temp1',
                        '3': 'temp2',
                        '6': 'temp3',
                        '8': 'temp4',
                        '11': 'temp5',
                        '12': 'temp6',
                        '15': 'temp7'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4,
                    temp5: temp5,
                    temp6: temp6,
                    temp7: temp7
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

    it('should correctly transpile a nested for loop', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
print(1);
for (i = getStart(); i < 21; i++) {
    print(2);
    for (j = getSecondStart(); j < 23; i++) {
        print(3);
        break;
    }
    print(4);
    break;
}
print(5);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1, temp2, temp3, temp4, temp5, temp6, temp7, temp8, temp9, temp10, temp11, temp12, temp13, temp14;
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
            temp7 = Resumable._resumeState_.temp7;
            temp8 = Resumable._resumeState_.temp8;
            temp9 = Resumable._resumeState_.temp9;
            temp10 = Resumable._resumeState_.temp10;
            temp11 = Resumable._resumeState_.temp11;
            temp12 = Resumable._resumeState_.temp12;
            temp13 = Resumable._resumeState_.temp13;
            temp14 = Resumable._resumeState_.temp14;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                temp0 = print;
                statementIndex = 1;
            case 1:
                Resumable.checkCallable('print', temp0), temp0(1);
                statementIndex = 2;
            case 2:
                temp1 = getStart;
                statementIndex = 3;
            case 3:
                temp2 = (Resumable.checkCallable('getStart', temp1), temp1());
                statementIndex = 4;
            case 4:
                i = temp2;
                statementIndex = 5;
            case 5:
                statementIndex = 6;
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22:
            case 23:
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 6:
                            temp3 = i;
                            statementIndex = 7;
                        case 7:
                            if (!(temp3 < 21)) {
                                break label0;
                            }
                            statementIndex = 8;
                        case 8:
                            temp4 = print;
                            statementIndex = 9;
                        case 9:
                            Resumable.checkCallable('print', temp4), temp4(2);
                            statementIndex = 10;
                        case 10:
                            temp5 = getSecondStart;
                            statementIndex = 11;
                        case 11:
                            temp6 = (Resumable.checkCallable('getSecondStart', temp5), temp5());
                            statementIndex = 12;
                        case 12:
                            j = temp6;
                            statementIndex = 13;
                        case 13:
                            statementIndex = 14;
                        case 14:
                        case 15:
                        case 16:
                        case 17:
                        case 18:
                        case 19:
                        case 20:
                        case 21:
                        case 22:
                            label1:
                                for (;;) {
                                    switch (statementIndex) {
                                    case 14:
                                        temp7 = j;
                                        statementIndex = 15;
                                    case 15:
                                        if (!(temp7 < 23)) {
                                            break label1;
                                        }
                                        statementIndex = 16;
                                    case 16:
                                        temp8 = print;
                                        statementIndex = 17;
                                    case 17:
                                        Resumable.checkCallable('print', temp8), temp8(3);
                                        statementIndex = 18;
                                    case 18:
                                        break label1;
                                    case 19:
                                        temp9 = i;
                                        statementIndex = 20;
                                    case 20:
                                        temp10 = temp9 + 1;
                                        statementIndex = 21;
                                    case 21:
                                        i = temp10;
                                        statementIndex = 22;
                                    case 22:
                                        temp9;
                                        statementIndex = 23;
                                    }
                                    statementIndex = 14;
                                }
                            statementIndex = 23;
                        case 23:
                            temp11 = print;
                            statementIndex = 24;
                        case 24:
                            Resumable.checkCallable('print', temp11), temp11(4);
                            statementIndex = 25;
                        case 25:
                            break label0;
                        case 26:
                            temp12 = i;
                            statementIndex = 27;
                        case 27:
                            temp13 = temp12 + 1;
                            statementIndex = 28;
                        case 28:
                            i = temp13;
                            statementIndex = 29;
                        case 29:
                            temp12;
                            statementIndex = 30;
                        }
                        statementIndex = 6;
                    }
                statementIndex = 30;
            case 30:
                temp14 = print;
                statementIndex = 31;
            case 31:
                Resumable.checkCallable('print', temp14), temp14(5);
                statementIndex = 32;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '2': 'temp1',
                        '3': 'temp2',
                        '6': 'temp3',
                        '8': 'temp4',
                        '10': 'temp5',
                        '11': 'temp6',
                        '14': 'temp7',
                        '16': 'temp8',
                        '19': 'temp9',
                        '20': 'temp10',
                        '23': 'temp11',
                        '26': 'temp12',
                        '27': 'temp13',
                        '30': 'temp14'
                    },
                    temp0: temp0,
                    temp1: temp1,
                    temp2: temp2,
                    temp3: temp3,
                    temp4: temp4,
                    temp5: temp5,
                    temp6: temp6,
                    temp7: temp7,
                    temp8: temp8,
                    temp9: temp9,
                    temp10: temp10,
                    temp11: temp11,
                    temp12: temp12,
                    temp13: temp13,
                    temp14: temp14
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

    it('should correctly transpile a break out of labeled for loop', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
my_block: for (i = 0; i < 4; i++) {
    print(1);
    if (true) {
        print(2);
        break my_block;
    }
    print(3);
}
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
                i = 0;
                statementIndex = 1;
            case 1:
                statementIndex = 2;
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                label_my_block:
                    for (;;) {
                        switch (statementIndex) {
                        case 2:
                            temp0 = i;
                            statementIndex = 3;
                        case 3:
                            if (!(temp0 < 4)) {
                                break label_my_block;
                            }
                            statementIndex = 4;
                        case 4:
                            temp1 = print;
                            statementIndex = 5;
                        case 5:
                            Resumable.checkCallable('print', temp1), temp1(1);
                            statementIndex = 6;
                        case 6:
                            statementIndex = 7;
                        case 7:
                        case 8:
                        case 9:
                            if (statementIndex > 7 || true) {
                                switch (statementIndex) {
                                case 7:
                                    temp2 = print;
                                    statementIndex = 8;
                                case 8:
                                    Resumable.checkCallable('print', temp2), temp2(2);
                                    statementIndex = 9;
                                case 9:
                                    break label_my_block;
                                }
                            }
                            statementIndex = 10;
                        case 10:
                            temp3 = print;
                            statementIndex = 11;
                        case 11:
                            Resumable.checkCallable('print', temp3), temp3(3);
                            statementIndex = 12;
                        case 12:
                            temp4 = i;
                            statementIndex = 13;
                        case 13:
                            temp5 = temp4 + 1;
                            statementIndex = 14;
                        case 14:
                            i = temp5;
                            statementIndex = 15;
                        case 15:
                            temp4;
                            statementIndex = 16;
                        }
                        statementIndex = 2;
                    }
                statementIndex = 16;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '2': 'temp0',
                        '4': 'temp1',
                        '7': 'temp2',
                        '10': 'temp3',
                        '12': 'temp4',
                        '13': 'temp5'
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

    it('should correctly transpile a for loop with variable declaration using function call in init', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
for (var i = getStart(); i < 4; i++) {
    print('inside');
}
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, i, temp0, temp1, temp2, temp3;
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
                temp0 = getStart;
                statementIndex = 1;
            case 1:
                temp1 = (Resumable.checkCallable('getStart', temp0), temp0());
                statementIndex = 2;
            case 2:
                i = temp1;
                statementIndex = 3;
            case 3:
                statementIndex = 4;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 4:
                            if (!(i < 4)) {
                                break label0;
                            }
                            statementIndex = 5;
                        case 5:
                            temp2 = print;
                            statementIndex = 6;
                        case 6:
                            Resumable.checkCallable('print', temp2), temp2('inside');
                            statementIndex = 7;
                        case 7:
                            temp3 = i + 1;
                            statementIndex = 8;
                        case 8:
                            i = temp3;
                            statementIndex = 9;
                        case 9:
                            i;
                            statementIndex = 10;
                        }
                        statementIndex = 4;
                    }
                statementIndex = 10;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '5': 'temp2',
                        '7': 'temp3'
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

    it('should correctly transpile a for loop with continue', function () {
        /******
         * NB: `i` will not be read separately here as it is a local variable
         ******/
        var inputJS = nowdoc(function () {/*<<<EOS
for (var i = getStart(); i < 4; i++) {
    one();
    continue;
    two();
}
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, i, temp0, temp1, temp2, temp3, temp4;
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
                temp0 = getStart;
                statementIndex = 1;
            case 1:
                temp1 = (Resumable.checkCallable('getStart', temp0), temp0());
                statementIndex = 2;
            case 2:
                i = temp1;
                statementIndex = 3;
            case 3:
                statementIndex = 4;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 4:
                            if (!(i < 4)) {
                                break label0;
                            }
                            statementIndex = 5;
                        case 5:
                            temp2 = one;
                            statementIndex = 6;
                        case 6:
                            Resumable.checkCallable('one', temp2), temp2();
                            statementIndex = 7;
                        case 7:
                            statementIndex = 10;
                            continue label0;
                        case 8:
                            temp3 = two;
                            statementIndex = 9;
                        case 9:
                            Resumable.checkCallable('two', temp3), temp3();
                            statementIndex = 10;
                        case 10:
                            temp4 = i + 1;
                            statementIndex = 11;
                        case 11:
                            i = temp4;
                            statementIndex = 12;
                        case 12:
                            i;
                            statementIndex = 13;
                        }
                        statementIndex = 4;
                    }
                statementIndex = 13;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '5': 'temp2',
                        '8': 'temp3',
                        '10': 'temp4'
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
