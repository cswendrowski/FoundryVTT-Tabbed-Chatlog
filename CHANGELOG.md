## Changelog

###  Fork -


### v1.1.0

Added notifications for new messages in inactive tabs.
Fixed new messages showing up incorrectly.

### v1.2.0

In Character messages without a scene attached will now show on the IC tab when toggled

### v1.3.4

You can now automatically send In Character and Out of Character chat messages to Discord. There is one global module setting for OOC messages. IC messages can be per-scene via a Scene setting - if this is not found, it will fallback to a global IC webhook if configured in the Module Settings.

Tabbed Chat now also properly integrates with https://github.com/sPOiDar/fvtt-module-hide-gm-rolls

### v1.6.0

Thanks to David Zvekic:
* Now works properly with Vance's Resizable Sidebar.
* Flush now only deletes the messages from the active TAB, leaving the messages on other tabs clean.

Thanks to mclemente:
* Polyglot messages should now correctly show / hide

Other changes:
* Chat messages can now be changed to be global instead of per-scene
* Users can now use a setting to autonavigate to a new tab when a message comes in
* Swapping off then back on to the Chat tab should now correctly highlight the active tab
* Whispers can now be treated as In Character instead of OOC