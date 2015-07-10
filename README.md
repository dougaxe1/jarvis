# Jarvis

## Framework Taxonomy

### Items:

1. Title
1. Type - provides context for the user (e.g. Menu Item, Taxonomy Term, Event Post Type).
1. Actions - array of actions to take on this item (e.g. View, Edit, Delete). The first action is the default.

Items are displayed in the list under the auto-complete for the user to select. Some items may only have a single action.

### Groups:

1. Name
1. Alias (optional) - potentially shorter name as a filter (e.g. cap for Co-Authors Plus)
1. Instant (T/F) - should group items be available instantly (page load)?
1. Search by default (T/F) - should group items be searched by default?

Default groups include Posts/Nodes, Taxonomy, and Menu Items. It is intended that plugins/modules will add their own additional groups (e.g. Views, Context, Co-Authors Plus, Feedport). 

A group must contain a method of retrieving items based on a search term.
Instant groups will need to return all possibilities on page load.
Resource intensive searches should not be searched by default (at developer discretion) unless singled out for searching.

By default, searches are performed on all groups. A user can signal their intention to filter by typing "```!```" followed by the alias of a group. Once selected, the following search term will only return results within the specified groups.
