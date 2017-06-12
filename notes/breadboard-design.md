Components types
================

Container - is controlled by a controller (possibly automatically instantiated), and has the view built into the component (possibly via composition). This is basically a self-contained useful component, which should be embeddable anywhere given the right environment. It should not allow any state to leave, except via a controller.

Control - used to allow the user to interact with a single value. should only hold state when it is required to accept incomplete data or visualise the state of user interaction -- but this state may be managed by a controller. Accepts a 'slot' -- an object managed by a Controller that holds its value, a callback to request an update, and any relevant context like comms state. Should accept a view where possible, but can hard code view when it is necessary for performance reasons. Can be decorated with `acceptsDefaultValue` to allow it to behave as an uncontrolled input.

View - just renders stuff, either for a Control, or for a Mountpoint

Exposers - used to expose information *about a component* that isn't available via props (including via DOM, React context, etc.) and inject it into the environment. Generally implemented as HoCs, e.g. exposeVisibile, exposeDimensions. Should not be used to inject information from the wider environment. Can be added to any component without affecting its type, so long as the information *stays inside* that component.


Parts:

- Editor control, just allows editing of a single source file, with embedded view
- Switch control, allows selection between a number of options, with configurable view
- acceptDefaultsFor (also injects `reset...` actions when a default is supplied)
- exposeVisibility
- exposeDimensions

- RA Breadboard Mode controller, manages modes based on injected dimensions and user actions
- BreadboardBuild class(transforms, require, packer, renderToString?)
  - #run(sources, pack) => { render(mountpoint, props), packedSource, paused windowWrapper (timeouts are queued for unpause, console messages are treated as "base" console messages that will always be shown) }
  - #renderToString(sources) (optional)
  - memoizes previous requests so that nothing has to be done if there have been no changes
- BreadboardMountpoint component
  - takes `render`, `windowWrapper`, `view`, `appEnvController`
  - sets windowWrapper's unmountedPause on umnount
  - renders on mount, re-renders on changes to appEnvController's output (could probably be controlledBy appEnvController)
  - view receives `renderMountpoint` -- an element with ref that holds the rendered contents

- Breadboard controller
  - accepts active modes, visible, sources, selectedFile
  - has selectedFile, sources, packedSource, render, windowWrapper as state
  - has a BreadboardBuild instance
  - sets windowWrapper's outOfViewPause when `visible` is false
  - when modes/sources change, runs build and sets the result on state

- RA Breadboard Container (usable as-is within doc, maybe with settings like defaultMode, defaultSelecteFile, etc.)
  - exposeVisibility
  - exposeDimensions
  - controlledBy ResponsiveModeController
  - acceptsDefaultFor( selectedFile, sources )
  - controlledBy BreadboardController

  - instantiates some appEnvController

  - can add HTML file to selected file optinos, and when selected, can generate and display it!
  - contains Switch control(s) that allow mode/selected file to be changed (the container may need logic to mulitlex options between files/modes)
  - depending on modes, may contain Editor control, HighlightedSource view, BreadboardMountpoint component, or other components

- RA Raw Breadboard Container (defines packer)
- RA Packed Breadboard Container (defines packer, renderToString)

- One more level of wrappers that contain loader, so that something can be rendered before breadboard module is downloaded


As we've got `acceptsDefaultFor`, onChangeSelectedfile and onChangeSources will be injected. This means that the editor can be hooked directly up to this, and the switch can be hooked up through an intermediate callback depending on mode.

The one issue with creating a themeable control is the idea of multiple modes. perhaps the idea would be a `renderBodyControls` and `renderSwitchControls` that gives appropriate switches/elements based on active modes and mode count. However, at that point it feels you may as well make a themed container instead of a control with a theme. Perhaps it'd need to have slots/controls and to have mode passed in from the outside or via a


----

Steps:

(Just keep all components within the breadboard or react-armory packages for the moment, where possible)

Steps

- Create 'editor' control with embedded view that fixes following issues:
  - tabs should be 2 spaces
  - use CodeMirror's internal scroll

- create injectDimensions HoC, and use it to manage injecting dimensions into existing breadboard. Rewrite the mode controller as a Hatt controller.

- get controlledBy working, and use it in conjunction with injectDimensions to inject modes into existing breadboard. refactor so mode changes are watched via componentWillReceiveProps

- set up fakeWindow to have two pause states: mount and visibility (only one will be used initially)

- merge existing build stuff into BreadboardBuild class. Write the class to accept multiple sources, but just pass the existing single source in

- create BreadboardMountpoint component and factor that out of the existing Breadboard class

- create Switch control

- create RA Breadboard container, with source switches and embedded state

- create acceptsDefaultsFor

- maybe create exposeVisibility (though it isn't really needed right now)

---

PRO features:

- fullscreen breadboard
- export
- show solution