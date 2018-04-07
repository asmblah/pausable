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

describe('Resumable Transpiler', function () {
    var transpiler;

    beforeEach(function () {
        transpiler = new Transpiler();
    });

    it('should correctly transpile an empty function', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
function doThings(num1, num2) {}
exports.result = doThings(2, 3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1;
    function doThings(num1, num2) {
    }
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = doThings(2, 3);
                statementIndex = 2;
            case 2:
                temp0.result = temp1;
                statementIndex = 3;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1'
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

    it('should correctly transpile a simple function with one calculation', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
function doThings(num1, num2) {
    var num3 = 2 + 4;

    return num3;
}
exports.result = doThings(2, 3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1;
    function doThings(num1, num2) {
        var statementIndex = 0, num3;
        return function resumableScope() {
            if (Resumable._resumeState_) {
                statementIndex = Resumable._resumeState_.statementIndex;
                Resumable._resumeState_ = null;
            }
            try {
                switch (statementIndex) {
                case 0:
                    num3 = 2 + 4;
                    statementIndex = 1;
                case 1:
                    return num3;
                    statementIndex = 2;
                }
            } catch (e) {
                if (e instanceof Resumable.PauseException) {
                    e.add({
                        func: resumableScope,
                        statementIndex: statementIndex + 1,
                        assignments: {}
                    });
                }
                throw e;
            }
        }.apply(this, arguments);
    }
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = doThings(2, 3);
                statementIndex = 2;
            case 2:
                temp0.result = temp1;
                statementIndex = 3;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1'
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

    it('should correctly transpile a simple function with no control structures', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
function doThings(num1, num2) {
    var num3 = 0;

    num3 += num1 + 1;

    return num3;
}
exports.result = doThings(2, 3);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0, temp1;
    function doThings(num1, num2) {
        var statementIndex = 0, num3, temp0;
        return function resumableScope() {
            if (Resumable._resumeState_) {
                statementIndex = Resumable._resumeState_.statementIndex;
                temp0 = Resumable._resumeState_.temp0;
                Resumable._resumeState_ = null;
            }
            try {
                switch (statementIndex) {
                case 0:
                    num3 = 0;
                    statementIndex = 1;
                case 1:
                    temp0 = num1;
                    statementIndex = 2;
                case 2:
                    num3 = num3 + (temp0 + 1);
                    statementIndex = 3;
                case 3:
                    return num3;
                    statementIndex = 4;
                }
            } catch (e) {
                if (e instanceof Resumable.PauseException) {
                    e.add({
                        func: resumableScope,
                        statementIndex: statementIndex + 1,
                        assignments: { '1': 'temp0' },
                        temp0: temp0
                    });
                }
                throw e;
            }
        }.apply(this, arguments);
    }
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = doThings(2, 3);
                statementIndex = 2;
            case 2:
                temp0.result = temp1;
                statementIndex = 3;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1'
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

    it('should correctly transpile an if (...) {...} statement', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
if (tools.sayYes) {
    exports.result = 'yes';
}
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
                temp0 = tools;
                statementIndex = 1;
            case 1:
                temp1 = temp0.sayYes;
                statementIndex = 2;
            case 2:
                statementIndex = 3;
            case 3:
            case 4:
                if (statementIndex > 3 || temp1) {
                    switch (statementIndex) {
                    case 3:
                        temp2 = exports;
                        statementIndex = 4;
                    case 4:
                        temp2.result = 'yes';
                        statementIndex = 5;
                    }
                }
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
                        '3': 'temp2'
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

    it('should correctly transpile an if (...) {...} statement with else clause', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
if (tools.sayYes) {
    exports.result = 'yes';
} else {
    exports.result = 'no';
}
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
                temp0 = tools;
                statementIndex = 1;
            case 1:
                temp1 = temp0.sayYes;
                statementIndex = 2;
            case 2:
                statementIndex = 3;
            case 3:
            case 4:
                if (statementIndex > 3 || temp1) {
                    switch (statementIndex) {
                    case 3:
                        temp2 = exports;
                        statementIndex = 4;
                    case 4:
                        temp2.result = 'yes';
                        statementIndex = 5;
                    }
                }
                statementIndex = 5;
            case 5:
                statementIndex = 6;
            case 6:
            case 7:
                if (statementIndex > 6 || !temp1) {
                    switch (statementIndex) {
                    case 6:
                        temp3 = exports;
                        statementIndex = 7;
                    case 7:
                        temp3.result = 'no';
                        statementIndex = 8;
                    }
                }
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
                        '3': 'temp2',
                        '6': 'temp3'
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

    it('should correctly transpile an if (...) {...} statement inside a block', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
{
    if (tools.sayYes) {
        exports.result = 'yes';
    }
}
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
                statementIndex = 1;
            case 1:
            case 2:
            case 3:
            case 4:
            case 5: {
                    switch (statementIndex) {
                    case 1:
                        temp0 = tools;
                        statementIndex = 2;
                    case 2:
                        temp1 = temp0.sayYes;
                        statementIndex = 3;
                    case 3:
                        statementIndex = 4;
                    case 4:
                    case 5:
                        if (statementIndex > 4 || temp1) {
                            switch (statementIndex) {
                            case 4:
                                temp2 = exports;
                                statementIndex = 5;
                            case 5:
                                temp2.result = 'yes';
                                statementIndex = 6;
                            }
                        }
                        statementIndex = 6;
                    }
                }
                statementIndex = 6;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '1': 'temp0',
                        '2': 'temp1',
                        '4': 'temp2'
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

    it('should correctly transpile an if (...) {...} statement with else clause where no compound statements are used', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
if (tools.sayYes)
    exports.result = 'yes';
else
    exports.result = 'no';
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
                temp0 = tools;
                statementIndex = 1;
            case 1:
                temp1 = temp0.sayYes;
                statementIndex = 2;
            case 2:
                statementIndex = 3;
            case 3:
            case 4:
                if (statementIndex > 3 || temp1) {
                    switch (statementIndex) {
                    case 3:
                        temp2 = exports;
                        statementIndex = 4;
                    case 4:
                        temp2.result = 'yes';
                        statementIndex = 5;
                    }
                }
                statementIndex = 5;
            case 5:
                statementIndex = 6;
            case 6:
            case 7:
                if (statementIndex > 6 || !temp1) {
                    switch (statementIndex) {
                    case 6:
                        temp3 = exports;
                        statementIndex = 7;
                    case 7:
                        temp3.result = 'no';
                        statementIndex = 8;
                    }
                }
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
                        '3': 'temp2',
                        '6': 'temp3'
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

    it('should correctly transpile a while (...) {...} statement', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
while (a > 4) {
    exports.result = doSomething();
}
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
                statementIndex = 1;
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 1:
                            temp0 = a;
                            statementIndex = 2;
                        case 2:
                            if (!(temp0 > 4)) {
                                break label0;
                            }
                            statementIndex = 3;
                        case 3:
                            temp1 = exports;
                            statementIndex = 4;
                        case 4:
                            temp2 = doSomething;
                            statementIndex = 5;
                        case 5:
                            temp3 = (Resumable.checkCallable('doSomething', temp2), temp2());
                            statementIndex = 6;
                        case 6:
                            temp1.result = temp3;
                            statementIndex = 7;
                        }
                        statementIndex = 1;
                    }
                statementIndex = 7;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '1': 'temp0',
                        '3': 'temp1',
                        '4': 'temp2',
                        '5': 'temp3'
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

    it('should correctly transpile an unlabelled "break;" statement', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
while (true) {
    break;
}
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0;
    return function resumableScope() {
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
            Resumable._resumeState_ = null;
        }
        try {
            switch (statementIndex) {
            case 0:
                statementIndex = 1;
            case 1:
            case 2:
                label0:
                    for (;;) {
                        switch (statementIndex) {
                        case 1:
                            if (!true) {
                                break label0;
                            }
                            statementIndex = 2;
                        case 2:
                            break label0;
                        }
                        statementIndex = 1;
                    }
                statementIndex = 3;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {}
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

    it('should correctly transpile multiple reads of the same variable', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = myVar + myVar;
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = myVar;
                statementIndex = 2;
            case 2:
                temp2 = myVar;
                statementIndex = 3;
            case 3:
                temp0.result = temp1 + temp2;
                statementIndex = 4;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '2': 'temp2'
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

    it('should correctly transpile a logical expression', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = first.second || third.fourth;
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = first;
                statementIndex = 2;
            case 2:
                temp2 = temp1.second;
                statementIndex = 3;
            case 3:
                statementIndex = 4;
            case 4:
            case 5:
                if (statementIndex > 4 || !temp2) {
                    switch (statementIndex) {
                    case 4:
                        temp3 = third;
                        statementIndex = 5;
                    case 5:
                        temp4 = temp3.fourth;
                        statementIndex = 6;
                    }
                }
                statementIndex = 6;
            case 6:
                temp5 = temp2 || temp4;
                statementIndex = 7;
            case 7:
                temp0.result = temp5;
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
                        '4': 'temp3',
                        '5': 'temp4',
                        '6': 'temp5'
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

    it('should correctly transpile a read->write->read', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = a + b;
c = a;
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
                temp0 = a;
                statementIndex = 1;
            case 1:
                temp1 = b;
                statementIndex = 2;
            case 2:
                a = temp0 + temp1;
                statementIndex = 3;
            case 3:
                temp2 = a;
                statementIndex = 4;
            case 4:
                c = temp2;
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
                        '3': 'temp2'
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

    it('should correctly transpile each element specified in an array literal', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = [a + 1, b + 2];
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = a;
                statementIndex = 2;
            case 2:
                temp2 = b;
                statementIndex = 3;
            case 3:
                temp0.result = [
                    temp1 + 1,
                    temp2 + 2
                ];
                statementIndex = 4;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '2': 'temp2'
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

    it('should correctly transpile each property specified in an object literal', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
exports.result = {val1: a + 1, val2: b + 2};
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
                temp0 = exports;
                statementIndex = 1;
            case 1:
                temp1 = a;
                statementIndex = 2;
            case 2:
                temp2 = b;
                statementIndex = 3;
            case 3:
                temp0.result = {
                    val1: temp1 + 1,
                    val2: temp2 + 2
                };
                statementIndex = 4;
            }
        } catch (e) {
            if (e instanceof Resumable.PauseException) {
                e.add({
                    func: resumableScope,
                    statementIndex: statementIndex + 1,
                    assignments: {
                        '0': 'temp0',
                        '1': 'temp1',
                        '2': 'temp2'
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

    it('should correctly transpile a variable declarator that refers to a previous one of same declaration', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
var myFirstVar = 1,
    mySecondVar = addOneTo(myFirstVar);
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, myFirstVar, mySecondVar, temp0, temp1;
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
                myFirstVar = 1;
                statementIndex = 1;
            case 1:
                temp0 = addOneTo;
                statementIndex = 2;
            case 2:
                temp1 = (Resumable.checkCallable('addOneTo', temp0), temp0(myFirstVar));
                statementIndex = 3;
            case 3:
                mySecondVar = temp1;
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
});
