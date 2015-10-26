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
    util = require('util');

function PauseException(resumer) {
    this.message = 'PauseException';
    this.reject = null;
    this.resolve = null;
    this.resumer = resumer;
    this.states = [];
}

util.inherits(PauseException, Error);

_.extend(PauseException.prototype, {
    add: function (state) {
        this.states.push(state);
    },

    now: function () {
        throw this;
    },

    resume: function (result) {
        var exception = this;

        try {
            exception.resumer(exception.resolve, exception.reject, null, result, exception.states);
        } catch (e) {
            // Just re-throw if another PauseException gets raised,
            // we're just looking for normal errors
            if (e instanceof PauseException) {
                throw e;
            }

            // Reject the promise for the run with the error thrown
            exception.reject(e);
        }
    },

    setPromise: function (resolve, reject) {
        var exception = this;

        exception.resolve = resolve;
        exception.reject = reject;
    },

    throw: function (error) {
        var exception = this;

        try {
            exception.resumer(exception.resolve, exception.reject, error, null, exception.states);
        } catch (e) {
            // Just re-throw if another PauseException gets raised,
            // we're just looking for normal errors
            if (e instanceof PauseException) {
                throw e;
            }

            // Reject the promise for the run with the error thrown
            exception.reject(e);
        }
    }
});

module.exports = PauseException;
