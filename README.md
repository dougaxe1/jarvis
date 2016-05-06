# Jarvis

_*J*ust *A* *R*ather *V*ery *I*ntelligent *S*earch_

This code is intended to serve as a basis for a separate WordPress plugin and Drupal module. It is purposely written closer to WordPress coding standards (because I like them better), but concepts should be converted to their respective platforms before deployment.

## Framework

The framework clearly separates the core functionality and display from results. This will allow Jarvis to provide a growing list of results and action without requiring any new core functionality.

## Addons

The core plugin/module provides initialization, permissions, user customizations, and interface while exposing filters/hooks to addons for results. 

The addons included with Jarvis cover basic use cases, because without them, Jarvis provides _no results_. The intension is to develop a sensible number of default core addons and package more specific addons separately. For this reason, addons should be as specific as possible to maintain modularity.

It is important to note that while Jarvis may be extended to provide the widest array of results, the final rank and display among all results will be controlled by Jarvis.

### Filters

Addons may furnish filters for all or part of the results they provide. While the final UI is not clear, available filters will be displayed to the user and one (or more?) may be selected to limit the total results.

### Context

Before requesting results, Jarvis informs all addons of the current context. The same context is provided to all addons, but it may be interpreted as necessary.

Currently, a context consists of the following parts (some may be _falsy_):

1. Filter - current filter(s) in place
1. Path - current path the user is viewing
1. Admin (T/F) - is the current path an admin path
1. Post/Node ID - current ID of content the user is viewing

Context parts may be edited or added via filter/hook.

### Results

For performance or user experience reasons, addons may choose to serve available results _before_ a user searches for them (instant results), and/or wait for a specific query to tailor the results (search results).

Instant results are "preloaded" client-side and always available for Jarvis to search based on the current context. Persistent menu items, or limited quick options are good candidates for instant results.

Search results are "traditional" based on a user query. Content or high overhead lookups are good candidates for search results.

### Items:

Results returned from addons are structured lists (arrays) of items:

1. ID - optional numeric identifier
1. Title
1. Key - Alias/URL
1. Abstract - Excerpt or short description
1. Type - string matched for filters
1. Label - provides context for the user (e.g. Menu Item, Taxonomy Term, Event Post Type). 
1. Actions - array of actions to take on this item (e.g. View, Edit, Delete). The first action is the default.

Items are displayed in the list under the auto-complete for the user to select.