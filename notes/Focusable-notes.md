

// TODO:
// - create a separate type of "Modal" that isn't a control (it doesn't need node/lifecycle/etc.)
// - add a dummy top modal control so I can get rid of "!parent" checks
// - pass in modalId from FocusManagerInterface
// - don't include modal ids in path

interface Modal {
  id: string;
  parentControlId: string; // control to focus when modal is destroyed
  parentModalId: string;
}

interface BaseControl {
  type: 'Focusable' | 'Group';
  id: string;
  modalId: string;
  path: string[]; // within modal
  latestPath: string[];
  index: number;
  lifecycle: any;
  node: any;
  childControls: Control[];
  childModals: Modal[];
}

interface GroupControl extends BaseControl {
  type: 'Group';
}

interface TopControl extends BaseControl {
  tabFocusableDescendents: FocusableInnerControl[];
}

interface InnerControl extends BaseControl {
  top: TopControl;
  parent: BaseControl;
  group: GroupControl;
}

interface FocusableInnerControl extends InnerControl {
  type: 'Focusable';
}


// Register
// --------
// In charge of handling static info that doesn't change except when added/removed from
//
// - modals
// - controls

// Changing state
// --------------
// Things that can change without the register changing
//
// - control indexes
// - current modal
// - next id
// - current id
// - previous id

class Register {
  // can include node, lifecycle as they don't change

  // can include a method to run a given set of lifecycles for a given id to a given parent id

  isTop(id) {

  }
}
