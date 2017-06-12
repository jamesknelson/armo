types of thing going on

- HoverController: listens to mouseenter/mouseleave to add a "hover" output to taxi
- DraggableController: communicates with dragDropManager to send its value to some dropzone somewhere. cancels on `onCancel` bus prop and passes through
- DropZoneController: communicates with dragDropManager to receive a value from a draggable somewhere (may want to focus after drop?) cancels on `onCancel` bus prop and passes through
- FocusableController: communicates with focusManager to keep track of its tabindex, and provide instance method(s) to change focus. may provide custom methods to focus specific children.
- ActivatableController: controller that adds listeners to `connect` that call an "onActivate" callback on specified buttons, including possibly mouse buttons, and add an "activating" output. adds `onCancel` listener to the bus, cancels when called and then continues up the bus.
- WheelController: injects relevant listeners onto `connect` and provides rate-limited lifecycles and callbacks
- ScopeController: provides "onCancel/onSubmit" handlers to bus that do not pass through if the relevant lifecycles are provided
- CancelController: calls bus onCancel when "escape" is hit
- SubmitController: calls bus onSubmit and cancels propagation on specified buttons


SwitchController extends ControlController

- implement model controller that composes children's model controllers for matchesQuery/isInDomain
- extends wheelController with lifecycles that focusNext/focusPrev
- add submit, cancel controllers
- add focusable controller in trap mode
- handle key events to filter/move focus
- pass appropriate buses into children:
  * pass through value when it matches the child's model
  * pass an onFocus that maps to onChange
- focus a child on initial focus if none is already focused


SerialController

- contains a serial list of other controllers
- the output of these controllers is on an instance variable called "internalOutput"
- any static "actions" methods on each serial controller will be added to the api of this controller, but bound to the internal controller
- can also define an "input", allowing the serialController to supply its internal methods for the props of the serial controllers
- you can provide a full output by pulling from "internalOutput"


(Could probably do ParallelController too, and probably *should* do this is as the base for react-controllers handling multiple controllers, giving a better story for how we can access statics on controllers / parallel controllers)


DropSwitchController (similar to SwitchController)

- adds a scope wiring `submit` to `change`
- extends ActivatableController with state to add `open` output that can be switched on with activation, closed with cancel / submit
- expects the control to render the items within another control that emits a "cancel" when a click is received outside of it


---

How to compose these?
---------------------

Problems:

- instance methods don't compose well
- statics probably don't compose well either
- controllers probably shouldn't hit each other's instance methods
- luckily, children are available everywhere

- the trick is making sure everything is available on the bus as it goes through
- maybe make a second "taxi" (a private bus) that contains things children can call on their parents, and is discarded by the final output.

- re: instance methods, they should be placed on an "api" static.

- maybe `connectors` can also be placed on a static, so that they can all be added in one shot? otherwise, they could just each emit a named connector with the wrapper controller merging this into a single "connect"

- use a `SerialController` that creates a new controller that runs its children in serial, discarding the taxi (except things in its own output) and allowing parents to be called during a flush from one controller to the next.
- it adds instance methods from all apis, but other statics don't get pulled up -- so ModelController needs to go up the top.