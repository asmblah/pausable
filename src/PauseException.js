/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash');

function PauseException(resumer) {
    this.promise = null;
    this.resumer = resumer;
    this.states = [];
}

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
            exception.resumer(exception.promise, null, result, exception.states);
        } catch (e) {
            // Just re-throw if another PauseException gets raised,
            // we're just looking for normal errors
            if (e instanceof PauseException) {
                throw e;
            }

            // Reject the promise for the run with the error thrown
            exception.promise.reject(e);
        }
    },

    setPromise: function (promise) {
        this.promise = promise;
    },

    throw: function (error) {
        var exception = this;

        try {
            exception.resumer(exception.promise, error, null, exception.states);
        } catch (e) {
            // Just re-throw if another PauseException gets raised,
            // we're just looking for normal errors
            if (e instanceof PauseException) {
                throw e;
            }

            // Reject the promise for the run with the error thrown
            exception.promise.reject(e);
        }
    }
});

module.exports = PauseException;
