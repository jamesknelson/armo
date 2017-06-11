CONTROL TYPES
-------------

- focusable: can be focused. any focusable children that are not part of a group will not be tab-focusable, but must be programatically focused by the control.
- group
  * allows grouping of focusable controls, without being a control itself
  * allows embedding of tabbable controls within a focusable group
  * can have an index, which will be used to to decide when its children receive tabs -- even though the group is not focusable itself
  * when embedded within a focusable, a group's controls will always have a greater tabindex than the tabindex of the focusable itself (and thus any other focusables embedded within it)
- modal: a group of controls that are not tab-focusable until manually focused, at which point all controls *outside* the modal become non-tab focusable while the modal becomes the new "root".


STORIES
-------

- a field is focused, with the following tabindex being a switch
- tab is pressed
- focusout is emitted on the field
- focusin is emitted on the switch
- manager.handleFocus(switchId) is called
- controlWillLoseFocus is called on the field controller
- controlWillReceiveFocus is called on the switch controller
- the switch controller calls focusFirstMatchingChild() with a predicate that select a child with the correct value
- manager.focus(childId) is called
- controlWillReceiveFocus is called on the option
- childWillReceiveFocus is called on the switch controller
- tabIndexMustChange is called on the option and the switch
- focus is called on the option's node
- controlDidBlur is called on the field Controller
- childDidFocus is called on the switch Controller
- controlDidFocus is called on the option Controller

Notes:
- the controller should not render anything until focusDidChange is called, unless it needs to render something
  that it will subsequently focus
- if `focus` is called within controlWillReceiveFocus, a corresponding `controlDidFocus` may not be called!
- focus should *only* be called within `controlWillReceiveFocus` on a child, and only when another child is not already focused. When `focus` is called outside of this scenario, a warning should be given.

- "down" is pressed
- switch controller calls manager.focus(nextId)
- controlWillLoseFocus is called on the option
- controlWillReceiveFocus is called on a nested dropdown
- the dropdown controller renders its dropdown menu, and waits to complete the render
- the dropdown controller calls focusFirstMatchingChild() on its id with a predicate that select a child with the correct value
- manager.focus(childId)
- controlWillReceiveFocus is called on an option in the nested dropdown
- childWillReceiveFocus is called on the nested dropdown
- tabIndexMustChange is called on the option and the nested option
- focus() is called on the nested option
- childDidFocus is called on the nested dropdown
- controlDidFocus is called on a nested option

- the user clicks on some markup belonging to the switch, but not any option
- focusout is emitted on the option
- ideally we'd cancel this but I don't think it is possible, so call manager.focus() on the currently focused option

- the user clicks on another option belonging to the dropdown
- focusout is emitted on the previous option
- focusin is emitted on the next option
- manage.handleFocus(nextOptionId) is called
- controlWillLoseFocus is called on the previous option
- controlWillReceiveFocus is called on the next option
- tabIndexMustChange is called on the two options
- focus() is called on the next option
- controlDidLoseFocus is called on the previous option
- controlDidReceiveFocus is called on the next option

- shift-tab is pressed
- focusout is emitted on the dropdown switch option
- focusin is called on field
- manager.handleFocus(fieldId) is called
- controlWillLoseFocus is called on the nested option's controller
- childrenWillLoseFocus is called on the nested dropdown's controller
- the nested option is unmounted
- the nested option controller calls destroy on its focusable
- childrenWillLoseFocus is called on the root switch
- controlWillReceiveFocus is called on the field
- tabIndexMustChange is called on the dropdown and the field
- focus() is called on the field
- childrenDidLoseFocus is called on the root switch
- childrenDidLoseFocus is called on the nested dropdown controller
- controlDidLoseFocus is *not* called on the dropdown option's controller, as it has been unmounted
- controlDidReceiveFocus is called on the field

- tab is pressed
- focusout is emitted on the field
- focusin is emitted on the dropdown switch
- manager.handleFocus(dropdownId) is called
- controlWillLoseFocus is called on the field
- controlWillReceiveFocus is called on the dropdown controller
- the dropdown controller renders its dropdown menu, and waits to complete the render
- the dropdown controller calls focusFirstMatchingChild() on its id with a predicate that select a child with the correct value
- manager.focus(optionId)
- controlWillReceiveFocus is called on the nested option
- childrenWillReceiveFocus is called on the nested dropdown
- childrenWillReceiveFocus is called on the root switch
- tabIndexMustChange is called on the nested option and the field
- focus() is called on the nested option
- controlDidLoseFocus is called on the field
- childrenDidReceiveFocus is called on the root switch
- childrenDidReceiveFocus is called on the nested dropdown
- controlDidReceiveFocus is called on the nested option


EVENTS
------

Can test order of events here: https://jsfiddle.net/66znLhfw/7/

- in main browsers:
  * focus
  * blur
  * use focusin on document to check what corresponding focusins we've received after a focusout, and defocus up the tree based on that
- in IE:
  * use focusin, focusout instead of focus/blur -- check target to make sure we're looking at the right node
  * we could use focusin/focusout in major browsers, but MDN warns against using it too much because of perf concerns
- in old firefox:
  * blur
  * focus
  * use capture focus on document, keep track of all focusable nodes with a weakmap, decide whether the new focused element is inside/outside the document based on this

blur/focus cannot be used in IE11 as they're async
focusin/focusout cannot be used in old firefox as they don't exist

Old firefox will need to tell the manager about the level of blur *before* "focus" is emitted on the event
Other browsers will need to tell the manager about the level of blur *after* "focus" or "focusin" events have been emitted on the controls


ACTIONS
-------

This can all be broken down into two actions on the manager:

- A new, known id was focused
  * similar to `focus`, except direct is true by default as a tab-focus will always go to previously focused child, while a mouse focus is basically direct.
- All focusable ids lost focus
  * same as blur()

Additionally, the following are needed for component developers:

- addControl(type, index, lifecycle, getItem)
  * cannot cause changes in any existing tabindex or focus states
- destroyControl(childId)
  * if this has a tabindex as it is next/previous to currently focused item, will need to move tabindex
  * if this is a modal, will need to return focus to parent modal (or root)
  * if this is focused and the last child of a group, will need to call childrenWillLoseFocus on parent, and if not in the process of focussing something else will need to follow this with
    + controlWillReceiveFocus (in the case of a focusable with no children)
  * if this was focused and is part of a group/focusable with children, focus should be moved to the next item
  * if this was focused and was the last child of a group, the group needs to lose focus (as it can't hold focus without any children)
- setControlIndex(childId, index)
  * this may cause a control to become previous/next to the existing focused control, moving another control out of the way
  * if changing the currently focused control, this may change what controls are previous/next
  * this cannot cause a change in focus, only tabindex
- blur()
  * this will cause {control/children}{Will/Did}LoseFocus to be called on all controls
  * tabindex will not change unless a modal loses focus
- focus(childId, direct=false)
  * if focusing a control with a previously focused child, return manager.focus(previouslyFocusedId) unless direct=true
  * if previous child no longer exists, work up the path until it finds a child that does (or a child if the control is a group)


STATE
-----

- register (lifecycles, node)
- currently focused id
- for each control:
  * parent ids
  * previously focused child id (if any)
  * index (not tabindex)
  * type


INVARIANTS
----------

- a group cannot be focused without a focused child
- destroying a control cannot cause childrenWillLoseFocus to be called unless it has no siblings
- changing tabindex cannot change tabindex of any controls other than immediate siblings to currently focused item
- focus(), except on a modal, can only cause changes in:
  * currently focused controls and their immediate siblings
  * the newly focused controls and their immediate siblings
- blur(), except when a modal is active, can only cause changes in the currently focused controls
- except when entering/leaving a modal, at maximum 2 elements may have tabIndex removed, 2 may have it added, and 4 may have it changed (the previously focused control, and its top-level parent).


IMPLEMENTATION DETAILS
----------------------

- each focusable at the root level will have a tabindex.
- an unfocused group at the root level will have one tabindex assigned to either its first or last child (depending on whether the currently focused item is before or after it)
- a focuable/group that is currently focused may have up to 3 tabindexes:
  * one for the currently focused control
  * possibly one each for previous/subsequent controls that are nested within groups/modalGroups within the same focusableGroup
- in order to facilitate focusable having up to 3 tabindexes, it is sufficient to double all the requested tabindexes that the user provides (this will create a space of one tabindex between each assigned tabindex, which can be used)
- should be possible to just make incremental changes except where a modal is focused/unfocused
- should have a function that returns a map of id to tabindex for a given currently focused id, which can be used when entering/leaving modals
- it may actually be easier to always return tabindex to the root when we're not focused on that control, and then focus the correct control based on direction we tabbed in from and the most recently focused child, otherwise clicking on the last field will cause every previous control with groups to have its tabindexes changed.


---

say you have a mixture of groups and focusables within another focusable.
- the top-level focusable only has one tab index. So either one of the group items, or the nested focusables can hold it (the previously active one)
- only one nested focusable can ever hold a tabindex. You cannot tab between nested focusables.
- once you've tabbed into a focusable, you can tab into any nested group controls, will cause the last selected focusables within the focusable (or the focusable itself) to become the "previous" tabindex
- when you get to the final grouped option, there will be no next index. the previous index can still be a grouped control
- if we tab into a subsequent control, we'll need to set the group tabindex to the last control within the last group
- if we tab into a prveious control, we can keep the group tabindex at whatever ungrouped focusable had focus
