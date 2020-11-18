## Mon Nov 16 19:04:56 CST 2020

Okay, so it's a tree. No big whoop.

## Mon Nov 16 18:06:38 CST 2020

I've really confused myself with this. Retaining the parent/child relationship
for two reasons.

First, to have a common pool of memory different eviction strategies, so you
could use the same pool of memory for a timed cache, for say authentication
tokens that expire after a timeout, and memory cache that evicts down to a
specific heft. You might want to have an eviction stategy based on count instead
of heft.

Second, you could have a cache for each tree in a database, then assert that
there are no referenced cache entries for the tree if you dispose of the tree
before you dispose of the entire cache.

Oh, and third, if you remove a tree and reopen it, it is good to have the keys
somehow qualified so that you don't hit old entries, which I encountered with my
new monolithic cache. Ended up putting an instance count in the key.

Heft is a concept that I'm definately holding onto. Timeouts are another concept
that is useful, I've reached for Magazine to implement those.

Okay, but a common pool for different eviction strategies and a pool slice per
tree, these are conflicting goals. A pool slice per tree would be yet another
list on top of the stategy list on top of the common list.

So tempting to remove the sub-cache strategy and just differentiate Magazine by
saying that it supports heft.

## Mon Nov 16 11:39:59 CST 2020

When I went to convert Strata to ES6 I implemented a new cache to see what I'd
come up with even though Magaizne is a relatively successful MRU. People have
discovered it on NPM. Someone even wrote a blog post about it.

 * [The Magazine cache](https://francesco.site/2014/06/26/the-magazine-cache.html).

The parent child relationship, however, was never as useful as it was awkward to
initialize. The idea was that we could assert that a specific cache had emptied
prior to the complete shutdown of the program. That is, assert that a cache for
a specific b-tree was empty when we deleted a collection during run time,
instead of asserting that all b-trees where empty at program shutdown.

The applications I've written conceal their caches behind an interface for the
most part and checking at the end of a unit test is usually enough to find
reference count problems. In fact, the most common bug is removing an entry with
mmultiple references, not having references mysteriously held at destruction.

Of course, it also bothers me that we duplicate the linked-list updates for two
linked lists. If it happened only at create and remove it would bother me less,
so I'm consideirng keeping the cache specific list in the order or creation
instead of LRU to save that energy, but it's probably not a meaningful
optimization.

The problem is that now I want to implement an R-Tree so I do want a cache that
I can reuse across modules and I want to be able to share that cache between
R-Trees and B-Trees, so this module will have to become that module.

## Older

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

## Expiration

You can simply implement expiration by stopping a purge, stopping the walk
backward through the list, when you reach an entry that has not yet expired. You
make progress by moving that entry to the head of the list, so that if there are
entries that have indeed expired, they can found at the head of the list.

Also, couldn't magazine manage an access timestamp for you?

## Eviction Types

I've exposed an iterator because there is more than the heft based eviction, but
now I'm realizing that there are a limited amount of evication types, and that I
don't want to debug the loop when I expose the iterator. If I create an `evict`
method that takes a string for type, `'heft'`, `'count'`, or `'before'`, then
I'll have eviction based on heft, count or expiration. The iterator is still
exposed if I need to evict based on something else.

Oh, right, because sometimes it is async.
