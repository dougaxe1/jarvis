# Jarvis

_*J*ust *A* *R*ather *V*ery *I*ntelligent *S*earch_

This code is intended to serve as a basis for a separate WordPress plugin and Drupal module. It is purposely written closer to WordPress coding standards (because I like them better), but concepts should be converted to their respective platforms before deployment.

## Framework Taxonomy

### Items:

1. Title
1. Type - provides context for the user (e.g. Menu Item, Taxonomy Term, Event Post Type).
1. Actions - array of actions to take on this item (e.g. View, Edit, Delete). The first action is the default.

Items are displayed in the list under the auto-complete for the user to select. Some items may only have a single action.

### Collections:

1. Name
1. Alias (optional) - potentially shorter name as a filter (e.g. cap for Co-Authors Plus)
1. Instant (T/F) - should collection items be available instantly (page load)?
1. Search by default (T/F) - should collection items be searched by default?

Default collections include Posts/Nodes, Taxonomy, and Menu Items. It is intended that plugins/modules will add their own additional collections (e.g. Views, Context, Co-Authors Plus, Feedport). 

A collection must contain a method of retrieving items based on a search term.
Instant collections will need to return all possibilities on page load.
Resource intensive searches should not be searched by default (at developer discretion) unless singled out for searching.

By default, searches are performed on all collections. A user can signal their intention to filter by typing "```!```" followed by the alias of a collection. Once selected, the following search term will only return results within the specified collections.
