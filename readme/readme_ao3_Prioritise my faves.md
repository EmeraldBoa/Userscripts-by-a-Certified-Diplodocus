Ao3 Prioritise My Faves
=======

When browsing [Archive of Our Own](https://archiveofourown.org/), hide works that do not prioritise your preferred characters or relationships. **Apply your filters directly from AO3, in a collapsible sidebar, without reloading the page.** 

AO3 struggles when it comes to finding works focused on minor characters, who are often tagged but only appear in the background. This script lets you hide stories where your faves are far down the tag list (in a supporting role). You can also avoid fics that focus on specific characters/relationships without excluding those tags entirely.

Forked from [this](https://greasyfork.org/en/scripts/18665-ao3-secondary-char-pairing-filter) script by [scriptfairy](https://greasyfork.org/en/users/36620-scriptfairy). I initially wanted to fix a couple of bugs and remove the URL restriction, but ended up adding more and more features until it ballooned into the monster you see here. Many thanks - shoulders of giants, etc. 

Will work side-by-side with [AO3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior) by tuff, if you have it (optional but highly-recommended blacklisting tool).

**Requires Tampermonkey or Violentmonkey.**

Features
--------

- Include/exclude characters or relationships found in the first N tags.  
Use **wildcards** (e.g. `"shika*"` to match `Shikaku/Shikamaru`) or **regex** (e.g. `"eli[sz]abeth"` to match `"Elizabeth/Elisabeth"`)

- Sidebar menu (collapsed) just above AO3's filter menu. Settings, including your current filter, are preserved when loading another page or closing the browser. Toggle filters on or off without reloading the page. Click a button to show/re-hide individual fics.

- **Tips and examples** popup window (click on **[?]**)

- Works side-by-side with [AO3 savior](https://greasyfork.org/en/scripts/3579-ao3-savior), if you have it installed, and mimics its apperance. Tick *"Ao3 savior is installed"* in *Settings* to prevent conflicts.

- Debug log (in settings)


-----

### Coming ~~soon~~ eventually to a cinema near you

- Highlight matched tags (optional toggle)

- Save your favourite searches and load them from a dropdown

- Back up and restore from file (may require an extension due to limitations of script managers). Speaking of which...

- ...Extension! (Lower priority, and may take me a long time. The script will remain regardless.)

<br>
<br>

# <span aria-hidden=true>🐞</span> Bugs & feedback

The script is currently in beta: please report any errors in functioning or appearance. I'd also love to hear suggestions, feature requests and any feedback on the UI (are the buttons and options intuitive? do they work as you would expect?)

### Please especially leave me a note if you

* use a screen reader or have other accessibility needs;
* use a custom AO3 site skin.

### Reporting bugs in "Apply Filter"  (e.g. nothing happens / all stories hidden ): 

1. double-check your filters for typos
2. Settings > **Debug mode** (tick)
3. Open your browser console log (ctrl + shift + I > Console) and reload the page.
4. Repeat the actions that caused the error, then copy the content of the browser console and send it to me here or on [github](https://github.com/EmeraldBoa/Userscripts-by-a-Certified-Diplodocus/issues), along with any other pertinent information (search URL, ).


## Known problems

- **Cannot handle multiple searches at once** (the script "remembers" one filter at a time).  
E.g.: 
    - Open a *Doctor Who* search and filter for [stories focused on the Brigadier](https://archiveofourown.org/tags/Alistair%20Gordon%20Lethbridge-Stewart/works) (`Include Characters: Alistair, 2`).
    - In a new tab, browse to *Star Trek* and find [stories focused on Uhura](https://archiveofourown.org/tags/Nyota%20Uhura/works) (`Include Characters: Uhura, 2`).
    - Now return to the first tab, and go to page 2. The "*Star Trek*: Uhura" filter, which was the most recently saved, will automatically (and incorrectly) be applied to the Doctor Who search.  

    **Solution:** if you are using several different filters simultaneously, **reapply the filter** before clicking to the next page in the search. This will ensure the script "remembers" the filter you currently want.

<br>
<br>

<mark>I'm going on holiday and the "a" key is broken on my laptop, so bugs will be fixed on my return. (1/7/25)</mark>