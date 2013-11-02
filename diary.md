# Magazine Diary

Notes on Magazine.

## Per Magazine Purge or Destroy

Two ways. One is to keep a second linked list that is a list of all of the
cartridges held by the magazine or, alternatively, simply a hash. As long as
we're linking, it might as well be a linked list though. Then to destroy the
magazine you keep calling remove on the head.

Alternatively, you could mark the magazine as defunct, then on purge you can
walk the entire linked list and remove any cartridges with a magazine that is
marked as defunct.

But, if we're walking anyway, we could walk the entire cache when we call purge,
looking for cartridges with the same magazine as this magazine and calling
remove on their keys.
