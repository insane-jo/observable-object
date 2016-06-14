# observable-object-es6
 
A small observable object library. Works in the browser and in Node. Can be used with es6 inheritance or as stand-alone lib.

For more information you can see jsdoc info in `index.es6` file.

## Install

Node

```
npm install observable-object-es6 --save
```
 
Browser

```
bower install observable-object-es6 --save
```
 
```html
<script src="bower_components/event-emitter-es6/dist/event-emitter.min.js"></script>
<script src="bower_components/observable-object-es6/dist/observable-object.min.js"></script>
``` 

## Usage

Node

```javascript
var ObservableObject = require('observable-object-es6');
var example = {
  n: 1,
  s: 'a',
  f: function () {
    console.info(this, arguments);
    return 123;
  }
};
var observed = new ObservableObject(example, {
  fields: 'q',
  emitOnEachPropChange: true,
  emitSummaryChanges: true
});

observed.on('change:q', console.info.bind(console));
observed.on('change', console.warn.bind(console));

observed.n = 5;
observed.q = 'new q value';
```

Browser

```js
var example = {
  n: 1,
  s: 'a',
  f: function () {
    console.info(this, arguments);
    return 123;
  }
};
var observed = new ObservableObject(example, {
  fields: 'q',
  emitOnEachPropChange: true,
  emitSummaryChanges: true
});

observed.on('change:q', console.info.bind(console));
observed.on('change', console.warn.bind(console));

observed.n = 5;
observed.q = 'new q value';
```

ES6

```js
class SomeObservableClass extends ObservableObject {
  constructor(propVal1, propVal2, propVal3) {
    super({
      prop1: propVal1,
      prop2: propVal2,
      prop3: popVal3
    }, {
      fields: ["fieldThanWasntInitializedOnConstructor"],
      emitOnEachPropChange: true
    });
  }
}

var observedInstance = new SomeObservableClass(1, 2, 3);

observedInstance.on('change', ::console.info);
observedInstance.on('change:prop1', ::console.warn);
observedInstance.on('change:fieldThanWasntInitializedOnConstructor', ::console.log);

observedInstance.fieldThanWasntInitializedOnConstructor = 'now this prop initted';

observedInstance.notObservedBeforeProperty = 'some value';
observedInstance.on('change:notObservedBeforeProperty', ::console.log);

observedInstance.fetchFields();

observedInstance.notObservedBeforeProperty = 'now this field observed';
```


## Instance Methods

### constructor(base, [opts])

An option can be passed to constructor

* `base` - any object, that contains props and vals, that need to be observed
* `opts` - settings object for create observable object
* `[opts.emitOnEachPropChange = false]` - if false, events `change:KEY_NAME` not firing
* `[opts.emitSummaryChanges = true]` - if false, summary events `change` not firing
* `[opts.eventEmitterStrictMode = false]` - strict mode for EventEmitter inherited instance.
* `[opts.emitDelay = 10]` - delay in ms for emit events. if 0 - all events fired synchronously
* `[opts.fields = []]` - additional fields, that need to be observed, but not initted in base property

### fetchFields()

Look for new initted fields, that wasn't observed before and make them watchable.

### on(event, callback)

Subscribe to an event

* `event` - the name of the event to subscribe to
* `callback` - the function to call when event is emitted (for transfer context use __bind__ method of Function.prototype) 

### once(event, callback)

Subscribe to an event only **once**

* `event` - the name of the event to subscribe to
* `callback` - the function to call when event is emitted (for transfer context use __bind__ method of Function.prototype)

### off(event[, callback])

Unsubscribe from an event or all events. If no callback is provided, it unsubscribes you from all events.

* `event` - the name of the event to unsubscribe from
* `callback` - the function used when binding to the event. If you used function with __bind__ method - must be passed the same function, that was getted after binding.

### emit(event[, ...arguments])

Trigger a named event

* `event` - the event name to emit
* `arguments...` - any number of arguments to pass to the event subscribers

### emitSync(event[, ...arguments])

Trigger a named event immediate (even the emitter was created as async instance)

* `event` - the event name to emit
* `arguments...` - any number of arguments to pass to the event subscribers

## Build
 
Build (Browserifies, and minifies)

```
npm install
npm run build
```