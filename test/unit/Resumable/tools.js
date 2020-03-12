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
    Resumable = require('../../../src/Resumable'),
    Transpiler = require('../../../src/Transpiler');

module.exports = {
    check: function (scenario, description) {
        describe(description, function () {
            var exports,
                result;

            beforeEach(function (done) {
                var expose;

                this.error = null;
                this.resolved = false;
                this.resumable = new Resumable(new Transpiler());

                exports = {};
                result = undefined;
                expose = {
                    exports: exports
                };

                if (_.isFunction(scenario.expose)) {
                    _.extend(expose, scenario.expose(this));
                } else {
                    _.extend(expose, {
                        tools: scenario.expose
                    });
                }

                this.resumable.execute(scenario.code, {expose: expose}).then(function (theResult) {
                    result = theResult;
                    this.resolved = true;
                    done();
                }.bind(this), function (e) {
                    this.resolved = false;
                    this.error = e;
                    done();
                }.bind(this));
            });

            if (scenario.hasOwnProperty('expectedResult')) {
                it('should resolve the promise with the correct result', function () {
                    expect(result).to.deep.equal(scenario.expectedResult);
                });
            }

            if (scenario.hasOwnProperty('expectedExports')) {
                it('should leave the exports object in the correct state', function () {
                    expect(exports).to.deep.equal(scenario.expectedExports);
                });
            }

            if (scenario.hasOwnProperty('expectedError')) {
                it('should reject the promise with the correct error', function () {
                    expect(this.error).not.to.be.null;

                    if (typeof scenario.expectedError === 'object') {
                        // Expecting an Error instance: check for correct class and message
                        expect(this.error).to.be.an.instanceOf(
                            Object.getPrototypeOf(scenario.expectedError).constructor
                        );
                        expect(this.error.toString()).to.equal(scenario.expectedError.toString());
                    } else {
                        // Expecting a primitive value: check for identity
                        expect(this.error).to.equal(scenario.expectedError);
                    }
                });
            } else {
                it('should not reject the promise', function () {
                    expect(this.error).to.be.null;
                });
            }

            if (scenario.expect) {
                scenario.expect();
            }
        });
    }
};
