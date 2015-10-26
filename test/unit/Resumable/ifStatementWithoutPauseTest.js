/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    sinon = require('sinon'),
    tools = require('./tools');

describe('Resumable if (...) {...} statement without pause', function () {
    _.each({
        'when condition is truthy': {
            code: nowdoc(function () {/*<<<EOS
with (scope) {
    if (1 === 1) {
        inTruthy;
        exports.result = 'yes';
    } else {
        inFalsy;
        exports.result = 'no';
    }
}
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var getInFalsy = sinon.stub().returns(1),
                    getInTruthy = sinon.stub().returns(2),
                    scope = {};

                state.getInFalsy = getInFalsy;
                state.getInTruthy = getInTruthy;

                Object.defineProperties(scope, {
                    inFalsy: {
                        get: getInFalsy
                    },
                    inTruthy: {
                        get: getInTruthy
                    }
                });

                return {
                    scope: scope
                };
            },
            expectedExports: {
                result: 'yes'
            },
            expect: function () {
                it('should read the inTruthy variable once', function () {
                    expect(this.getInTruthy).to.have.been.calledOnce;
                });

                it('should not read the inFalsy variable at all', function () {
                    expect(this.getInFalsy).not.to.have.been.called;
                });
            }
        },
        'when condition is falsy': {
            code: nowdoc(function () {/*<<<EOS
with (scope) {
    if (1 === 2) {
        inTruthy;
        exports.result = 'yes';
    } else {
        inFalsy;
        exports.result = 'no';
    }
}
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var getInFalsy = sinon.stub().returns(1),
                    getInTruthy = sinon.stub().returns(2),
                    scope = {};

                state.getInFalsy = getInFalsy;
                state.getInTruthy = getInTruthy;

                Object.defineProperties(scope, {
                    inFalsy: {
                        get: getInFalsy
                    },
                    inTruthy: {
                        get: getInTruthy
                    }
                });

                return {
                    scope: scope
                };
            },
            expectedExports: {
                result: 'no'
            },
            expect: function () {
                it('should read the inFalsy variable once', function () {
                    expect(this.getInFalsy).to.have.been.calledOnce;
                });

                it('should not read the inTruthy variable at all', function () {
                    expect(this.getInTruthy).not.to.have.been.called;
                });
            }
        },
        'when condition is falsy and no compound statement is used': {
            code: nowdoc(function () {/*<<<EOS
with (scope) {
    if (1 === 2)
        exports.result = inTruthy;
    else
        exports.result = inFalsy;
}
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var getInFalsy = sinon.stub().returns('no'),
                    getInTruthy = sinon.stub().returns('yes'),
                    scope = {};

                state.getInFalsy = getInFalsy;
                state.getInTruthy = getInTruthy;

                Object.defineProperties(scope, {
                    inFalsy: {
                        get: getInFalsy
                    },
                    inTruthy: {
                        get: getInTruthy
                    }
                });

                return {
                    scope: scope
                };
            },
            expectedExports: {
                result: 'no'
            },
            expect: function () {
                it('should read the inFalsy variable once', function () {
                    expect(this.getInFalsy).to.have.been.calledOnce;
                });

                it('should not read the inTruthy variable at all', function () {
                    expect(this.getInTruthy).not.to.have.been.called;
                });
            }
        }
    }, tools.check);
});
