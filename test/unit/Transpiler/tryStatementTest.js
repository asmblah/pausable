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
                        throw new Resumable.ResumeException(temp0);
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        throw e;
                    }
                    if (e instanceof Resumable.ResumeException) {
                        e = e.error;
                    } else {
                        statementIndex = 3;
                    }
                    try {
                        switch (statementIndex) {
                        case 3:
                            c = 3;
                            statementIndex = 4;
                        }
                    } catch (resumableError) {
                        if (resumableError instanceof Resumable.PauseException) {
                            resumablePause = resumableError;
                            temp0 = e;
                        } else {
                            temp0 = resumableError;
                        }
                        throw resumableError;
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
                        throw new Resumable.ResumeException(temp0);
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        throw e;
                    }
                    if (e instanceof Resumable.ResumeException) {
                        e = e.error;
                    } else {
                        statementIndex = 4;
                    }
                    try {
                        switch (statementIndex) {
                        case 4:
                            d = 4;
                            statementIndex = 5;
                        case 5:
                            e = 5;
                            statementIndex = 6;
                        }
                    } catch (resumableError) {
                        if (resumableError instanceof Resumable.PauseException) {
                            resumablePause = resumableError;
                            temp0 = e;
                        } else {
                            temp0 = resumableError;
                        }
                        throw resumableError;
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

    it('should correctly transpile when catch is empty', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} catch (e) {
}
c = 3;
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
                a = 1;
                statementIndex = 1;
            case 1:
                statementIndex = 2;
            case 2:
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        throw e;
                    }
                }
                statementIndex = 3;
            case 3:
                c = 3;
                statementIndex = 4;
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

    it('should correctly transpile when there are both catch and finally blocks', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} catch (e) {
    c = 3;
} finally {
    d = 4;
}
e = 5;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, temp0 = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
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
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                        break;
                    case 3:
                        throw new Resumable.ResumeException(temp0);
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        resumablePause = e;
                        throw e;
                    }
                    if (e instanceof Resumable.ResumeException) {
                        e = e.error;
                    } else {
                        statementIndex = 3;
                    }
                    try {
                        switch (statementIndex) {
                        case 3:
                            c = 3;
                            statementIndex = 4;
                        }
                    } catch (resumableError) {
                        if (resumableError instanceof Resumable.PauseException) {
                            resumablePause = resumableError;
                            temp0 = e;
                        } else {
                            temp0 = resumableError;
                        }
                        throw resumableError;
                    }
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 4) {
                        statementIndex = 4;
                    }
                    switch (statementIndex) {
                    case 4:
                        d = 4;
                        statementIndex = 5;
                    }
                    if (temp0 !== Resumable.UNSET) {
                        throw temp0;
                    }
                }
                statementIndex = 5;
            case 5:
                e = 5;
                statementIndex = 6;
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

    it('should correctly transpile when there is no catch block, only finally', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} finally {
    c = 3;
}
d = 4;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, resumableUncaughtError = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
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
                    }
                } catch (resumableError) {
                    if (resumableError instanceof Resumable.PauseException) {
                        resumablePause = resumableError;
                    } else {
                        resumableUncaughtError = resumableError;
                    }
                    throw resumableError;
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 3) {
                        statementIndex = 3;
                    }
                    switch (statementIndex) {
                    case 3:
                        c = 3;
                        statementIndex = 4;
                    }
                    if (resumableUncaughtError !== Resumable.UNSET) {
                        throw resumableUncaughtError;
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
                    assignments: {}
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

    it('should correctly transpile when there is no catch block, only a nested finally', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
    try {
        c = 3;
        throw 'jump';
        d = 4;
    } finally {
        e = 5;
        throw 'inner';
    }
    f = 6;
} finally {
    g = 7;
    return 'my final result';
}
h = 8;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, resumableUncaughtError = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
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
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                    case 3:
                        statementIndex = 4;
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        try {
                            switch (statementIndex) {
                            case 4:
                                c = 3;
                                statementIndex = 5;
                            case 5:
                                throw 'jump';
                            case 6:
                                d = 4;
                                statementIndex = 7;
                            }
                        } catch (resumableError) {
                            if (resumableError instanceof Resumable.PauseException) {
                                resumablePause = resumableError;
                            } else {
                                resumableUncaughtError = resumableError;
                            }
                            throw resumableError;
                        } finally {
                            if (resumablePause) {
                                throw resumablePause;
                            }
                            if (statementIndex >= 4 && statementIndex < 7) {
                                statementIndex = 7;
                            }
                            switch (statementIndex) {
                            case 7:
                                e = 5;
                                statementIndex = 8;
                            case 8:
                                throw 'inner';
                            }
                            if (resumableUncaughtError !== Resumable.UNSET) {
                                throw resumableUncaughtError;
                            }
                        }
                        statementIndex = 9;
                    case 9:
                        f = 6;
                        statementIndex = 10;
                    }
                } catch (resumableError) {
                    if (resumableError instanceof Resumable.PauseException) {
                        resumablePause = resumableError;
                    } else {
                        resumableUncaughtError = resumableError;
                    }
                    throw resumableError;
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 10) {
                        statementIndex = 10;
                    }
                    switch (statementIndex) {
                    case 10:
                        g = 7;
                        statementIndex = 11;
                    case 11:
                        return 'my final result';
                        statementIndex = 12;
                    }
                    if (resumableUncaughtError !== Resumable.UNSET) {
                        throw resumableUncaughtError;
                    }
                }
                statementIndex = 12;
            case 12:
                h = 8;
                statementIndex = 13;
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

    it('should correctly transpile when there is a return inside the try clause', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    return 21;
} finally {
    c = 3;
}
d = 4;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, resumableReturnValue = Resumable.UNSET, resumableUncaughtError = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
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
                        return resumableReturnValue = 21;
                        statementIndex = 3;
                    }
                } catch (resumableError) {
                    if (resumableError instanceof Resumable.PauseException) {
                        resumablePause = resumableError;
                    } else {
                        resumableUncaughtError = resumableError;
                    }
                    throw resumableError;
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 3) {
                        statementIndex = 3;
                    }
                    switch (statementIndex) {
                    case 3:
                        c = 3;
                        statementIndex = 4;
                    }
                    if (resumableUncaughtError !== Resumable.UNSET) {
                        throw resumableUncaughtError;
                    }
                    if (resumableReturnValue !== Resumable.UNSET) {
                        return resumableReturnValue;
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
                    assignments: {}
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

    it('should correctly transpile when there is a return inside the catch clause with finally', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} catch (e) {
    return 'my result';
} finally {
    c = 3;
}
d = 4;
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, resumableReturnValue = Resumable.UNSET, temp0 = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
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
                try {
                    switch (statementIndex) {
                    case 2:
                        b = 2;
                        statementIndex = 3;
                        break;
                    case 3:
                        throw new Resumable.ResumeException(temp0);
                    }
                } catch (e) {
                    if (e instanceof Resumable.PauseException) {
                        resumablePause = e;
                        throw e;
                    }
                    if (e instanceof Resumable.ResumeException) {
                        e = e.error;
                    } else {
                        statementIndex = 3;
                    }
                    try {
                        switch (statementIndex) {
                        case 3:
                            return resumableReturnValue = 'my result';
                            statementIndex = 4;
                        }
                    } catch (resumableError) {
                        if (resumableError instanceof Resumable.PauseException) {
                            resumablePause = resumableError;
                            temp0 = e;
                        } else {
                            temp0 = resumableError;
                        }
                        throw resumableError;
                    }
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 4) {
                        statementIndex = 4;
                    }
                    switch (statementIndex) {
                    case 4:
                        c = 3;
                        statementIndex = 5;
                    }
                    if (resumableReturnValue !== Resumable.UNSET) {
                        return resumableReturnValue;
                    }
                    if (temp0 !== Resumable.UNSET) {
                        throw temp0;
                    }
                }
                statementIndex = 5;
            case 5:
                d = 4;
                statementIndex = 6;
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

    it('should correctly transpile when there is a return after the entire try statement', function () {
        var inputJS = nowdoc(function () {/*<<<EOS
a = 1;
try {
    b = 2;
} finally {
    c = 3;
}
return 'my result';
EOS
*/;}), // jshint ignore:line
            expectedOutputJS = nowdoc(function () {/*<<<EOS
(function () {
    var statementIndex = 0, resumableUncaughtError = Resumable.UNSET;
    return function resumableScope() {
        var resumablePause = null;
        if (Resumable._resumeState_) {
            statementIndex = Resumable._resumeState_.statementIndex;
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
                    }
                } catch (resumableError) {
                    if (resumableError instanceof Resumable.PauseException) {
                        resumablePause = resumableError;
                    } else {
                        resumableUncaughtError = resumableError;
                    }
                    throw resumableError;
                } finally {
                    if (resumablePause) {
                        throw resumablePause;
                    }
                    if (statementIndex >= 2 && statementIndex < 3) {
                        statementIndex = 3;
                    }
                    switch (statementIndex) {
                    case 3:
                        c = 3;
                        statementIndex = 4;
                    }
                    if (resumableUncaughtError !== Resumable.UNSET) {
                        throw resumableUncaughtError;
                    }
                }
                statementIndex = 4;
            case 4:
                return 'my result';
                statementIndex = 5;
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
