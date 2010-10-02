Holmes
======

Holmes is an in-browser JavaScript debugger that lets users collect information
about an error and submit it to developers without having any programming /
debugging skills.

By default, it will log any calls to global functions, when they were called,
how long they take, and what they return. It also provides
` _holmes.log(something)`, which logs any object passed to it.

You can set up your own serializer for the function calls or returns. Function
call serializers receive the function name and the `arguments` object, and can
traverse for callers, etc. The default serializer only logs arguments that are
not functions or objects, to save space, but passed-in functions can send
anything.

If you have any questions or comments, feel free to contact me at andy [dot]
schmitz [at] gmail [dot] com.

I have not decided on a license for Holmes yet. Please contact me before reusing
it.
