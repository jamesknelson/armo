# Why is focus controlled by methods instead of props?

The nature of the browser is that only one element can have focus at once. Moving the focus to one element will remove focus from another.

Or in other words, the currently focused element is a piece of mutable, global state. And we can't change this.

With this in mind, we have a choice. Do we try and force this piece of state into a component prop-based API, or do we can just go with the flow and only use props to *indicate* state after the fact, with changes coming from elsewhere?

I've gone with the second option. It feels futile to fight the browser by trying to fit focus mutations into a prop-based API. And even if I can make it work, it is a lot of effort for something that doesn't feel at all natural. After all, changing a prop on one element should not cause a totally unrelated element in a different part of the application to require its own prop to change. It is just counter-intuitive.