import EventEmitter from 'event-emitter-es6';

const DEFAULT_OPTS = {
    emitOnEachPropChange: false,
    emitSummaryChanges: true,
    strictMode: false,
    eventEmitterStrictMode: false,
    emitDelay: 10,
    fields: []
};

function getOptValue(opt, key) {
    return (opt.hasOwnProperty(key) ? opt[key] : DEFAULT_OPTS[key]);
}

class ObservableObject extends EventEmitter {
    /**
     * @param {!Object.<string, *>} base
     * @param {?{}} opts
     * @param {boolean} [opts.emitOnEachPropChange = false]
     * @param {boolean} [opts.emitSummaryChanges = true]
     * @param {boolean} [opts.eventEmitterStrictMode = false]
     * @param {number} [opts.emitDelay = 10]
     * @param {string[]} [opts.fields = []]
     */
    constructor(base, opts) {
        if (!base) {
            throw 'Base object can not be blank!';
        } else if (typeof base !== 'object') {
            throw 'Base object must be an object!';
        }

        if (!opts) {
            opts = {};
        }

        let emitterOpts = {
            strictMode: (opts.hasOwnProperty('eventEmitterStrictMode') ? opts.eventEmitterStrictMode : DEFAULT_OPTS.eventEmitterStrictMode),
            emitDelay: 0
        };

        super(emitterOpts);

        this.__options = opts;
        this.__state = {};
        this.__changes = {};
        this.__registeredFields = Object.keys(this).concat(['__registeredFields']);
        Object.keys(base).concat(getOptValue(opts, 'fields')).forEach((key) => {
            this[key] = base[key];
        });
        this.fetchFields();

        if ( getOptValue(opts, 'strictMode') ) {
            Object.seal(this);
        }
    }

    /**
     * Look for new initted fields, that wasn't observed before and make them watchable.
     */
    fetchFields() {
        let newFields = Object.keys(this).filter((key) => {
            return this.__registeredFields.indexOf(key) === -1;
        });

        let newFieldsDefinition = {};

        newFields = newFields.map((key) => {
            let val = this[key];

            if (typeof val === 'function') {
                val = val.bind(this);
            }
            newFieldsDefinition[key] = {
                get: () => {
                    return this.__state[key];
                },
                set: (newVal) => {
                    if (typeof newVal === 'function') {
                        newVal = newVal.bind(this);
                    }
                    this.__addChange(key, this.__state[key], newVal);
                    this.__state[key] = newVal;
                    return newVal;
                }
            };

            return {
                field: key,
                value: val
            }
        });

        Object.defineProperties(this, newFieldsDefinition);

        newFields.forEach((row) => {
            this.__registeredFields.push(row.field);
            this[row.field] = row.value;
        });
    }

    /**
     * @param key
     * @param oldValue
     * @param newValue
     * @protected
     */
    __addChange(key, oldValue, newValue) {
        let currentChange = {
            field: key,
            oldValue: oldValue,
            newValue: newValue
        };


        let changes = this.__changes[key];
        if (!changes) {
            this.__changes[key] = changes = [];
        }
        changes.push(currentChange);

        this.__emitChangesIfNeeded();
    }

    /**
     * @protected
     */
    __emitChangesIfNeeded() {
        let delay = getOptValue(this.__options,'emitDelay');
        if (delay && !this.__options.timeoutId) {
            this.__options.timeoutId = setTimeout(::this.__emitChanges, delay);
        } else if (!delay) {
            this.__emitChanges();
        }
    }

    /**
     * @protected
     */
    __emitChanges() {
        let changes = this.__changes;
        this.__changes = {};
        this.__options.timeoutId = undefined;

        if ( getOptValue(this.__options, 'emitSummaryChanges') ) {
            this.emit('change', changes);
        }

        if ( getOptValue(this.__options, 'emitOnEachPropChange') ) {
            Object.keys(changes).forEach((key) => {
                this.emit('change:' + key, changes[key]);
            });
        }
    }

    /**
     * Drops changes if them was collected and clears timeout if it was emitted.
     */
    dropChanges() {
        if (this.__changes) {
            this.__changes = {};
        }
        if (this.__options.timeoutId) {
            delete this.__options.timeoutId;
        }
    }
}

module.exports = ObservableObject;