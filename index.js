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
