/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

var _ = require('lodash'),
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

                this.resumable.execute(scenario.code, {expose: expose}).done(function (theResult) {
                    result = theResult;
                    this.resolved = true;
                    done();
                }.bind(this)).fail(function (e) {
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

            if (scenario.expectedExports) {
                it('should leave the exports object in the correct state', function () {
                    expect(exports).to.deep.equal(scenario.expectedExports);
                });
            } else if (!scenario.hasOwnProperty('expectedResult')) {
                it('should reject the promise with the correct error', function () {
                    expect(this.error).not.to.be.null;
                    expect(this.error.toString()).to.equal(scenario.expectedError.toString());
                });
            }

            if (scenario.expect) {
                scenario.expect();
            }
        });
    }
};
