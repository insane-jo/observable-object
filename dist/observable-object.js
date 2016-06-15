(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ObservableObject = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventEmitterEs = require('event-emitter-es6');

var _eventEmitterEs2 = _interopRequireDefault(_eventEmitterEs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_OPTS = {
    emitOnEachPropChange: false,
    emitSummaryChanges: true,
    strictMode: true,
    eventEmitterStrictMode: false,
    emitDelay: 10,
    fields: []
};

function getOptValue(opt, key) {
    return opt.hasOwnProperty(key) ? opt[key] : DEFAULT_OPTS[key];
}

var ObservableObject = function (_EventEmitter) {
    _inherits(ObservableObject, _EventEmitter);

    /**
     * @param {!Object.<string, *>} base
     * @param {?{}} opts
     * @param {boolean} [opts.emitOnEachPropChange = false]
     * @param {boolean} [opts.emitSummaryChanges = true]
     * @param {boolean} [opts.eventEmitterStrictMode = false]
     * @param {number} [opts.emitDelay = 10]
     * @param {string[]} [opts.fields = []]
     */

    function ObservableObject(base, opts) {
        _classCallCheck(this, ObservableObject);

        if (!base) {
            throw 'Base object can not be blank!';
        } else if ((typeof base === 'undefined' ? 'undefined' : _typeof(base)) !== 'object') {
            throw 'Base object must be an object!';
        }

        if (!opts) {
            opts = {};
        }

        var emitterOpts = {
            strictMode: opts.hasOwnProperty('eventEmitterStrictMode') ? opts.eventEmitterStrictMode : DEFAULT_OPTS.eventEmitterStrictMode,
            emitDelay: 0
        };

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ObservableObject).call(this, emitterOpts));

        _this.__options = opts;
        _this.__state = {};
        _this.__changes = {};
        _this.__registeredFields = Object.keys(_this).concat(['__registeredFields']);
        Object.keys(base).concat(getOptValue(opts, 'fields')).forEach(function (key) {
            _this[key] = base[key];
        });
        _this.fetchFields();
        return _this;
    }

    /**
     * Look for new initted fields, that wasn't observed before and make them watchable.
     */


    _createClass(ObservableObject, [{
        key: 'fetchFields',
        value: function fetchFields() {
            var _this2 = this;

            var newFields = Object.keys(this).filter(function (key) {
                return _this2.__registeredFields.indexOf(key) === -1;
            });

            var newFieldsDefinition = {};

            newFields = newFields.map(function (key) {
                var val = _this2[key];

                if (typeof val === 'function') {
                    val = val.bind(_this2);
                }
                newFieldsDefinition[key] = {
                    get: function get() {
                        return _this2.__state[key];
                    },
                    set: function set(newVal) {
                        if (typeof newVal === 'function') {
                            newVal = newVal.bind(_this2);
                        }
                        _this2.__addChange(key, _this2.__state[key], newVal);
                        _this2.__state[key] = newVal;
                        return newVal;
                    }
                };

                return {
                    field: key,
                    value: val
                };
            });

            Object.defineProperties(this, newFieldsDefinition);

            newFields.forEach(function (row) {
                _this2.__registeredFields.push(row.field);
                _this2[row.field] = row.value;
            });
        }

        /**
         * @param key
         * @param oldValue
         * @param newValue
         * @protected
         */

    }, {
        key: '__addChange',
        value: function __addChange(key, oldValue, newValue) {
            var currentChange = {
                field: key,
                oldValue: oldValue,
                newValue: newValue
            };

            var changes = this.__changes[key];
            if (!changes) {
                this.__changes[key] = changes = [];
            }
            changes.push(currentChange);

            this.__emitChangesIfNeeded();
        }

        /**
         * @protected
         */

    }, {
        key: '__emitChangesIfNeeded',
        value: function __emitChangesIfNeeded() {
            var delay = getOptValue(this.__options, 'emitDelay');
            if (delay && !this.__options.timeoutId) {
                this.__options.timeoutId = setTimeout(this.__emitChanges.bind(this), delay);
            } else if (!delay) {
                this.__emitChanges();
            }
        }

        /**
         * @protected
         */

    }, {
        key: '__emitChanges',
        value: function __emitChanges() {
            var _this3 = this;

            var changes = this.__changes;
            this.__changes = {};
            this.__options.timeoutId = undefined;

            if (getOptValue(this.__options, 'emitSummaryChanges')) {
                this.emit('change', changes);
            }

            if (getOptValue(this.__options, 'emitOnEachPropChange')) {
                Object.keys(changes).forEach(function (key) {
                    _this3.emit('change:' + key, changes[key]);
                });
            }
        }

        /**
         * Drops changes if them was collected and clears timeout if it was emitted.
         */

    }, {
        key: 'dropChanges',
        value: function dropChanges() {
            if (this.__changes) {
                this.__changes = {};
            }
            if (this.__options.timeoutId) {
                delete this.__options.timeoutId;
            }
        }
    }]);

    return ObservableObject;
}(_eventEmitterEs2.default);

module.exports = ObservableObject;

},{"event-emitter-es6":2}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_VALUES = {
    emitDelay: 10,
    strictMode: false
};

/**
 * @typedef {object} EventEmitterListenerFunc
 * @property {boolean} once
 * @property {function} fn
 */

/**
 * @class EventEmitter
 *
 * @private
 * @property {Object.<string, EventEmitterListenerFunc[]>} _listeners
 * @property {string[]} events
 */

var EventEmitter = function () {

    /**
     * @constructor
     * @param {{}}      [opts]
     * @param {number}  [opts.emitDelay = 10] - Number in ms. Specifies whether emit will be sync or async. By default - 10ms. If 0 - fires sync
     * @param {boolean} [opts.strictMode = false] - is true, Emitter throws error on emit error with no listeners
     */

    function EventEmitter() {
        var opts = arguments.length <= 0 || arguments[0] === undefined ? DEFAULT_VALUES : arguments[0];

        _classCallCheck(this, EventEmitter);

        var emitDelay = void 0,
            strictMode = void 0;

        if (opts.hasOwnProperty('emitDelay')) {
            emitDelay = opts.emitDelay;
        } else {
            emitDelay = DEFAULT_VALUES.emitDelay;
        }
        this._emitDelay = emitDelay;

        if (opts.hasOwnProperty('strictMode')) {
            strictMode = opts.strictMode;
        } else {
            strictMode = DEFAULT_VALUES.strictMode;
        }
        this._strictMode = strictMode;

        this._listeners = {};
        this.events = [];
    }

    /**
     * @protected
     * @param {string} type
     * @param {function} listener
     * @param {boolean} [once = false]
     */


    _createClass(EventEmitter, [{
        key: '_addListenner',
        value: function _addListenner(type, listener, once) {
            if (typeof listener !== 'function') {
                throw TypeError('listener must be a function');
            }

            if (this.events.indexOf(type) === -1) {
                this._listeners[type] = [{
                    once: once,
                    fn: listener
                }];
                this.events.push(type);
            } else {
                this._listeners[type].push({
                    once: once,
                    fn: listener
                });
            }
        }

        /**
         * Subscribes on event type specified function
         * @param {string} type
         * @param {function} listener
         */

    }, {
        key: 'on',
        value: function on(type, listener) {
            this._addListenner(type, listener, false);
        }

        /**
         * Subscribes on event type specified function to fire only once
         * @param {string} type
         * @param {function} listener
         */

    }, {
        key: 'once',
        value: function once(type, listener) {
            this._addListenner(type, listener, true);
        }

        /**
         * Removes event with specified type. If specified listenerFunc - deletes only one listener of specified type
         * @param {string} eventType
         * @param {function} [listenerFunc]
         */

    }, {
        key: 'off',
        value: function off(eventType, listenerFunc) {
            var _this = this;

            var typeIndex = this.events.indexOf(eventType);
            var hasType = eventType && typeIndex !== -1;

            if (hasType) {
                if (!listenerFunc) {
                    delete this._listeners[eventType];
                    this.events.splice(typeIndex, 1);
                } else {
                    (function () {
                        var removedEvents = [];
                        var typeListeners = _this._listeners[eventType];

                        typeListeners.forEach(
                        /**
                         * @param {EventEmitterListenerFunc} fn
                         * @param {number} idx
                         */
                        function (fn, idx) {
                            if (fn.fn === listenerFunc) {
                                removedEvents.unshift(idx);
                            }
                        });

                        removedEvents.forEach(function (idx) {
                            typeListeners.splice(idx, 1);
                        });

                        if (!typeListeners.length) {
                            _this.events.splice(typeIndex, 1);
                            delete _this._listeners[eventType];
                        }
                    })();
                }
            }
        }

        /**
         * Applies arguments to specified event type
         * @param {string} eventType
         * @param {*[]} eventArguments
         * @protected
         */

    }, {
        key: '_applyEvents',
        value: function _applyEvents(eventType, eventArguments) {
            var typeListeners = this._listeners[eventType];

            if (!typeListeners || !typeListeners.length) {
                if (this._strictMode) {
                    throw 'No listeners specified for event: ' + eventType;
                } else {
                    return;
                }
            }

            var removableListeners = [];
            typeListeners.forEach(function (eeListener, idx) {
                eeListener.fn.apply(null, eventArguments);
                if (eeListener.once) {
                    removableListeners.unshift(idx);
                }
            });

            removableListeners.forEach(function (idx) {
                typeListeners.splice(idx, 1);
            });
        }

        /**
         * Emits event with specified type and params.
         * @param {string} type
         * @param eventArgs
         */

    }, {
        key: 'emit',
        value: function emit(type) {
            for (var _len = arguments.length, eventArgs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                eventArgs[_key - 1] = arguments[_key];
            }

            if (this._emitDelay) {
                setTimeout(this._applyEvents.call(this, type, eventArgs), this._emitDelay);
            } else {
                this._applyEvents(type, eventArgs);
            }
        }

        /**
         * Emits event with specified type and params synchronously.
         * @param {string} type
         * @param eventArgs
         */

    }, {
        key: 'emitSync',
        value: function emitSync(type) {
            for (var _len2 = arguments.length, eventArgs = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                eventArgs[_key2 - 1] = arguments[_key2];
            }

            this._applyEvents(type, eventArgs);
        }
    }]);

    return EventEmitter;
}();

module.exports = EventEmitter;

},{}]},{},[1])(1)
});