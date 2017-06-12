(Just keep all components within the breadboard or react-armory packages for the moment, where possible)

Steps

✔︎ Create 'editor' control with embedded view that fixes following issues:
  - tabs should be 2 spaces
  - use CodeMirror's internal scroll

✔ create injectDimensions HoC, and use it to manage injecting dimensions into existing breadboard. Rewrite the mode controller as a Hatt controller.

✔ get controlledBy working, and use it in conjunction with injectDimensions to inject modes into existing breadboard. refactor so mode changes are watched via componentWillReceiveProps

- set up fakeWindow to have two pause states: mount and visibility (only one will be used initially)

- merge existing build stuff into BreadboardBuild class. Write the class to accept multiple sources, but just pass the existing single source in

- create BreadboardMountpoint component and factor that out of the existing Breadboard class

- create Switch control

- create RA Breadboard container, with source switches and embedded state

- create acceptsDefaultsFor

- maybe create exposeVisibility (though it isn't really needed right now)