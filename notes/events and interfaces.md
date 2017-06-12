- Target/Source objects are "handlers". They're basically objects full of lifecycle methods, some of which return values, and some which are required. They are filled out with environment information.
- Handlers are registered so that actions and monitors can use them when necessary
- A handler has a specific "type". Changes to type will cause creation of a new handler.

- A "monitor" is an interface to the current state of the app, used by the collector function (and sometimes internally)
- There are source/target-specific monitors, as well as a global monitor
- Components subscribe to the global monitor to be notified when there may be changes to process.

- A "connector" registers nodes/ids with the backend to make sure events are watched and associated with the correct ids

- A "backend" is the code that listens to DOM events, and calls Redux actions in response


---


Armo
====

A library to help implement *Controls*. That is, components that handle user input.

Controls communicate with the outside world through a **Bus** -- an object that provides access to the environment, and handlers for the control's events. These handlers should be provided by **controllers**, and include:

- maybe onOperate(operation) -- specify the operation to apply to the value, not the new value itself
- onChange(newItem?, oldItem?)
- onActivate(item?)
- onHover(item?, draggedItem?)
- onDragStart(item?)
- onDragEnd(item?, droppedItem?)
- onDrop(item?, draggedItem?)
- onFocus(item?)
- onBlur(item?)
- onSubmit()
- onCancel() (only called if cannot cancel this control's current action)

Other data on the bus can include:

- controlManager (embeds: disabled, )
- locationManager
- route
- model
- value

The `fork()` function can be used to focus on in one part of a value/model/item

props
-----

A control can be configured through its props

- disabled
- tabindex (will default to "0" when required)
- children? (if specified, these should also be controls!)

events
------

- a key event that is not handled by its control should be passed to its parent control

state
-----

Global state will be managed in a central store, including:

- registered controls (and their controllers, parents)
- drag state:
  * drag type
  * initial item
  * source control id
  * target control ids
  * drop result
  * did drop
  * is source public
- focused control ids
- last focused id within each trap group (for when tab focus returns to the trap group)
- ids within the current modal group

- a stack of controls can be either activating or submitting. cancel/focus/blur are immediate

probably don't want to store values/models/disabled state -- instead preferring to handle this through the bus

actions
-------

- focus
- blur
- cancel
- keydown
- keyup
- drag actions


controllers
-----------

Armo uses Controllers for handlers. Each controller extends a base controller, which registers with the controlManager to be notified of appropriate events.

Unlike react-dnd, controllers do not have access to their controlled instance. The controlled components are meant to be dumb.

Instead of a `collect()` function, the controller's `output()` method will be used. It should add `connect...` methods to connect up the various elements, and the control component can either pass these through to views or convert these to `render...` methods.

### public api

instance:

A Controller's instance API is concerned with moving focus around within
it. This API is imperative, as browser focus itself is a single piece of
global state, so there is no clean declarative API.

- focus()
- focusMatch(query)
- focusValue(item)
- focusNext()
- focusPrevious()
- focusFirst()
- focusLast()
- blur()

- cancel() - cancels any current keystrokes, clicks, drags, etc.

static:

The static API of a Control is to give parent controls the information they
need to decide how that component should be configured in the first place.
These are statics instead of instance methods, as they allow props to be
generated before the component is rendered.

- isInDomain(props, value) - is the given value in domain, without knowing what value will be on the bus?
- matchesQuery(props, query) - woudld the given query match this element?
- defaultBehaviors = { [key: string]: { down, up } }
- focusType = "trap" | "tabbable" | "focusable" | "delegatable" | "modal" | "unfocusable"
- isDraggable
- isDropZone
- isHoverable
- doesUseWheel

### lifecycle

Lifecycle methods need to be available before the controlled component is
mounted, as their response may decide whether the component actually *is*
mounted, whether it has other props injected, etc.

- getControlValue()

- canDropOnControl(value) - defaults to !bus.disabled
- canDragControl() - defaults to !bus.disabled
- canFocusControl() - defaults to !bus.disabled
- isDraggingControl()

- controlHoverChanged(e, value?)
- controlWasDroppedOn(e, value)
- controlDragStarted(e)
- controlDragEnded(e, value)
- controlWasPressed(keyOrButton, position?) - can be used with mouse buttons
- controlWasReleased(keyOrButton, position?) - can be used with mouse buttons
- controlDidFocus()
- controlDidBlur()
- controlDidScroll(distance) - used by wheel events

- wheel events?

### output

generally, the output should be comprised of some of the following:

- connect() - adds ref that adds focus/blur events w/ control id, adds tabindex, adds key events to deepest control

- bus
  - controlManager (if there are any children)
  - value
  - *modifications specific to the expected types of children*

- disabled
- focused
- hovering
- dragging
- activating
- submitting

### monitor

To prevent unnecessary copying of control state, a handler can access its current state through `this.monitor`. Some of this information will be global, and some will be local.

- isFocused(controlId, { shallow: false })
- isHovering(controlId, { shallow: false })
- isActivating(controlId)
- isSubmitting(controlId)

- isOverTarget(targetId)
- isDraggingSource(sourceId)
- canDropOnTarget(targetId)
- canDragSource(sourceId)
- getDragItem()
- getDragSourceId()
- getDragTargetIds()
- getDropItem()
- didDrop()
- isDragSourcePublic()

// these are only used for DragLayer, which isn't necessary at the start
- getDragInitialClientOffset
- getDragInitialSourceClientOffset
- getDragClientOffset
- getDragSourceClientOffset
- getDragDifferenceFromInitialOffset

- etc.


---


controller config:

- valued: getValue() instance method

- focusType: "trap" | "tabbable" | "focusable" | "delegatable" | "modal" | "unfocusable"
  * delegatable controls will delegate their focus to a child
  * modals are not themselves focusable, but change the way their children are treated
  * unfocusable controls cannot receive focus themselves, but are still treated as "focused" when a child is focused
- draggable (must be valued)
- dropzone

- activatable (must be focusable) -- adds onActivate, controlWillActivate, controlDidActivate, 'activate' behavior

- queryable -- `matchesQuery` static
- modelable -- `isInDomain` static
- changeable -- implemented by control itself

if focusable, keys are mapped to actions:
- submit
- activate
- cancel
- custom
- delegate (default, goes up chain)


interface rules:

- focus type: based on focusType static, defaults to "unfocusable"
- valued: if propotype.getValue() exists
- activatable: if 'activate' behavior is mapped
- submittable: if 'submit' behavior is mapped
- cancellable: if 'cancel' behavior is mapped
- list: if 'focus...' methods are specified. warn if not also focusable/tabbable/trap
- draggable: if any draggable lifecycles are specified. warn if not also valued.
- droptarget: if any droptarget lifecycles are specified
- queryable: if static is provided
- modelable: if static is provided


keys:

- key handlers are set in the deepest focusable by the backend
- tabindex is added to the node by the backend
- keyDown/keyUp lifecycles allow controls to handle keypresses that weren't handled by their children
- keyDown/keyUp receive (e, next), allowing them to prevent the default behavior, and/or pass the event to the next control to be handled.
- instead of mouse/touch events, we have "activate" and "hover", that have position if initiated by pointing device
- additionally, a mouse/touch event can cause a control to be focused without activating it, which is useful when it is disabled
- if a mouse/touch event is not handled by a single control, it can be passed to next one too. same with drag.

- activate/submit can be split out to the controller subclass, as they aren't used by anything else
- list can also be part of the controller subclass, so long as controller instance methods are available on the wrapper instance
- cancel seems to be core - it can be used to cancel an in-progress keypress, click or drag.
- possibly activatable/submittable controllers can be stacked under a ControlController, using onCancel/onActivate/onSubmit/disabled from the bus.
- otherwise, could add a "keyBehaviors" system like that from the existing controlcontroller, accepting custom behaviors, that are cancelled if escape is pressed in between.
- or could just do manual implementation. the only activatables should be button/option, so this isn't a lot of work. submittables will be more common, but probably can just handle that on keyDown for the moment.

---

events:

focus (any focusable)
blur (primary focusable)

keydown (primary focusable)
keyup (primary focusable)

mouseenter (any focusable)
mouseleave (any focusable)

mouse/touchdown (any focusable)
mouse/touchup (any focusable)

dragstart/drapstop (any draggable)
drop (any droppable)

- can avoid adding focus/blur/key/mousetouchupdown events if there are no focusables
- these should all be added/removed by the backend (can use different mobile/desktop backends)
- whether they're added or not depends on the connector

---

- activate/submit/cancel can all be implemented at a different level, by handling the mouse/key/touch events
- actually probably don't do activate/submit/cancel at a different level. key events are not avaialable on mobile!
- key events cannot be relied upon. they should have sane defaults so people don't have to use them in general
- let's just say that we don't need to instrospect on whether a control is activatable/submittable/cancellable? any control is activatable/submittable if we call the correct method. If we want to provide visual indication of this, we need to do it manually.
- let's use a `defaultBehaviors` static to map keys/mouse buttons to behaviors. you can also manually implement keyUp, keyDown, which will receive (e) -- calling e.preventDefault() will prevent the defaultBehaviors (or any browser defined default behaviors). Calling e.stopPropagation() will stop the parent from receiving anything. The parent can check "e.defaultPrevented" to see if some other behavior has already taken place. defaultBehaviors are just objects with 'start/stop'. Lib behaviors may be available for activate, submit, cancel, etc.

---

- key handlers can actually be implemented using native react events, as they're bubbling events. no need to overcomplicate things.
- a BehaviorController could be added in between the component and the ControlController to add behaviors to keys, mouse buttons, etc.
- focus/drag state can be inected into the BehaviorController. the `connect` can be wrapped in another connect that adds key handlers and accepts a bus `onActivate` property, injects an `activating` prop into the output.
- a ControlController should add its value to the bus. This way, any next controllers have access to the value.
- a DragController can
