// ==UserScript==
// @name         AO3: Priority tag filter
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.4.0
// @description  Hide work if chosen tags are late in sequence, or if blacklisted tags are early
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @icon         https://raw.githubusercontent.com/EmeraldBoa/Userscripts-by-a-Certified-Diplodocus/refs/heads/main/images/icons/ao3-logo-by-bingeling-GPL.svg
// @license      GPL-3.0-or-later
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_setValues
// @grant        GM_getValue
// @grant        GM_getValues
// @grant        GM_deleteValues
// ==/UserScript==

/* global GM_addStyle, GM_setValue, GM_setValues, GM_getValues, GM_deleteValues */

/* AO3 logo designed by bingeling. Licensed under GNU 2+ https://commons.wikimedia.org/wiki/File:Archive_of_Our_Own_logo.png

Currently active on works/* and tags/* pages. To also enable on user pages, add the following line in the header:
    // @match        http*://archiveofourown.org/users/*

TO-DOs (later)
    [ ] list functions and changes from scriptfairy's version
    [ ] modify to use AO3's fold/message. IF Ao3 class appears, add message to the fold. IF not, proceed as normal.
    [ ] better searching
        [ ] handle diacritics
        [ ] wildcards are unintuitive. Rework so you don't need
          to wrap the *name* in asterisks (make it a WORD)
https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript/37511463#37511463
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
https://www.davidbcalhoun.com/2019/matching-accented-strings-in-javascript/
    [x] test with "GM_getValue / GM_setValue". Would require [x] means "done in HTML"
        [x] a menu (to display and edit saved settings)
        [x] pop-up / expansion toggle showing regex hints
        [x] button to enable/disable?
        [x] "apply" (re-run the script)
        [x] option to save settings to .txt file?
    IF I make it an extension (which I'd have to, to save the files, I think), then
        [ ] save current settings to extension
        [ ] dropdown to choose between saved settings

TO DO : UI                                                                                                         (ongoing)

    [x] add menu (HTML + CSS + JS for fold/unfold)
        [x] consistent "TPF-..." class names
        [x] default to collapsed
    [x] get config info from menu
        [ ] clean & validate
        [x] get regex/wildcards from radio buttons
    [x] run existing code to apply filters
        [x] use apply button to apply/remove filters (now works when all filters are deselected)
        [x] check/enable toggle button
        [x] toggle button needs to work with "apply" (prevent user from applying filter when filters are hidden)
        [x] add "clear filters" button
        [x] default fields to locked. // TODO: test if this makes for an intuitive experience.
                or: select (check) if you click on the textbox. Could be annoying, esp. when it comes to deselects.
        [ ] add another "apply" button at top (MAYBE)
        [ ] split to its own form (MAYBE - needs to work with AO3)
          reason: solve issue where "return" submits AO3's filters and reloads the page!
            looks like it won't work (absolute positioning - don't think I can put a form element above it)
    [ ] redo "hider" CSS/html (maybe to match AO3sav folding - hide/unhide)
        [x] add AO3sav timer to settings
    [x] save/load with GM_get and GM_set
        [x] save result of "clear filters"
        [x] todo: test what happens if I hit "clear filters" in the second form:
            does it clear the priority form? (could affect the GM_get/set): answer: NO!
        [ ] remove unused GM_ functions. Test GM_getValues and GM_setValues in ViolentMonkey.
    [x] config section
        [x] basic set up
        [x] ao3sav setting > add GM_set
        [x] update html + css in all files
    [ ] info popup(s)
    [ ] add error messages for incorrect inputs (popup? in menu?)

'------------------------------------------------------------------------------------------------------------------ */
(function () {
    'use strict'
    const enableVerboseLogging = true // set to 'true' for debugging purposes
    const $ = document.querySelector.bind(document) // shorthand for readability
    const $$ = document.querySelectorAll.bind(document)

    // get settings from script storage (default values if not)
    const stored = GM_getValues({
        isExpanded: false,
        filterIsOn: 1,
        characters: null,
        relationships: null,
        excludedCharacters: null,
        excludedRelationships: null,
        format: 'regex',
        ao3SaviorIsInstalled: true,
    })

    const works = $$('.work.blurb')

    // add collapsible menu directly above AO3's filter sidebar. Get DOM objects.
    const filterSidebar = $('#work-filters')
    if (!filterSidebar) { return }
    filterSidebar.insertAdjacentHTML('afterbegin',
        `<h3 class="landmark heading">Tag priority</h3>
        <fieldset class="tpf__menu tpf__filters">
            <legend>Tag priority:</legend> <!--is this redundant?-->
            <dl>
                <dt class="tpf__filter-head collapsed">
                    <button type="button" class="expander" aria-expanded="false" aria-controls="tpf__menu-content">
                        Tag priority
                    </button>
                    <button type="button" id="tpf__filter-toggle" class="current" aria-pressed="true">On</button>
                </dt>
                <dd id="tpf__menu-content" class="expandable">
                    <section class="tpf__wrap" aria-describedby="tpf__header-include">
                        <div class="tpf__head">
                            <h4 id="tpf__header-include">Include</h4> (at least one)
                            <button type="button" class="question" aria-label="help">?</button>
                        </div>
                        <section class="tpf__tag-block include characters">
                            <label id="tpf__include-chars">
                                <input type="checkbox">
                                <span class="indicator" aria-hidden="true"></span>
                                <span id="block-include-chars"><span class="landmark">Include </span>Characters</span>
                            </label>
                            <textarea class="tpf__tag-list" rows="3" autocomplete="off" autocapitalize="off"
                                spellcheck="false" placeholder="Gilgamesh, Enkidu"></textarea>
                            <label class="tpf__within">...within the first <input type="text" class="tpf__tag-lim">
                                tags</label>
                        </section>
                        <section class="tpf__tag-block include relationships">
                            <label>
                                <input type="checkbox">
                                <span class="indicator" aria-hidden="true"></span>
                                <span><span class="landmark">Include </span>Relationships</span>
                            </label>
                            <textarea class="tpf__tag-list" rows="3" autocomplete="off" autocapitalize="off"
                                spellcheck="false" placeholder="Gilgamesh*Enkidu, Enkidu*Gilgamesh"></textarea>
                            <label class="tpf__within">...within the first <input type="text" class="tpf__tag-lim">
                                tags</label>
                        </section>
                    </section>
                    <section class="tpf__wrap" aria-describedby="tpf__header-exclude">
                        <div class="tpf__head">
                            <h4 id="tpf__header-exclude">Exclude</h4>
                            <button type="button" class="question" aria-label="help">?</button>
                        </div>
                        <section class="tpf__tag-block exclude characters">
                            <label>
                                <input type="checkbox">
                                <span class="indicator" aria-hidden="true"></span>
                                <span><span class="landmark">Exclude </span>Characters</span>
                            </label>
                            <textarea class="tpf__tag-list" rows="3" autocomplete="off" autocapitalize="off"
                                spellcheck="false"></textarea>
                            <label class="tpf__within">...within the first <input type="text" class="tpf__tag-lim"
                                    aria-label="N">
                                tags</label>
                        </section>
                        <section class="tpf__tag-block exclude relationships">
                            <label>
                                <input type="checkbox">
                                <span class="indicator" aria-hidden="true"></span>
                                <span><span class="landmark">Exclude </span>Relationships</span>
                            </label>
                            <textarea class="tpf__tag-list" rows="3" autocomplete="off" autocapitalize="off"
                                spellcheck="false" placeholder="*Ishtar*"></textarea>
                            <label class="tpf__within">...within the first <input type="text" class="tpf__tag-lim">
                                tags</label>
                        </section>
                    </section>
                    <section class="tpf__settings" aria-describedby="tpf__header-settings">
                        <h3 id="tpf__header-settings" class="landmark">Settings</h3>
                        <fieldset>
                            <legend>
                                Format
                            </legend>
                            <label>
                                <input type="radio" name="format" id="tpf__opt-wildcard" value="wildcard" form=""
                                    checked><!--omit from parent form-->
                                <span class="indicator" aria-hidden="true"></span>
                                <span>wildcards (*)</span>
                            </label>
                            <label>
                                <input type="radio" name="format" id="tpf__opt-regex" value="regex"
                                    form=""><!--omit from parent form-->
                                <span class="indicator" aria-hidden="true"></span>
                                <span>regex</span>
                            </label>
                            <button type="button" class="question" aria-label="help">?</button>
                        </fieldset>
                    </section>
                    <section class="actions" aria-describedby="tpf__header-submit">
                        <h3 id="tpf__header-submit" class="landmark">
                            Submit
                        </h3><button class="tpf__apply" type="button">Apply filters</button>
                    </section>
                    <dl>
                        <dt id="tpf__config-head" class="filter-toggle collapsed">
                            <button type="button" class="expander" aria-expanded="false" aria-controls="tpf__config-head"
                                aria-label="Settings">⚙️ Settings</button>
                            <p class="footnote">
                                <a href="#work-filters">Clear Filters</a>
                            </p>
                        </dt>
                        <dd class="tpf__config expandable">
                            <label>
                                <input id="tpf__setting-AO3-sav" type="checkbox">
                                <span class="indicator" aria-hidden="true"></span>
                                <span>AO3 Savior is installed</span>
                                <span class="explanatory-text">(prevent conflict)</span>
                            </label>
                            <div class="actions">
                                <button class="save" type="button">Export tag filters to file</button>
                                <button class="load" type="button">Import saved tag filters</button>
                            </div>
                        </dd>
                    </dl>
                </dd>
            </dl>
        </fieldset>`
    )
    const filterMenu = {
        container: $('.tpf__filter-head'),
        expander: $('.tpf__filter-head .expander'),
        toggle: $('#tpf__filter-toggle'),
    }
    const settingsMenu = {
        container: $('#tpf__config-head'),
        expander: $('#tpf__config-head .expander'),
        AO3sav: $('#tpf__setting-AO3-sav'),
    }

    // set values
    settingsMenu.AO3sav.checked = stored.ao3SaviorIsInstalled

    // collapse/expand the menu; set aria-expanded in the expander control
    let isExpanded = stored.isExpanded
    setExpandedStatus()
    filterMenu.expander.addEventListener('click', () => {
        isExpanded = !isExpanded
        GM_setValue('isExpanded', isExpanded)
        setExpandedStatus()
    })
    function setExpandedStatus() {
        filterMenu.container.classList.toggle('expanded', isExpanded)
        filterMenu.container.classList.toggle('collapsed', !isExpanded)
        filterMenu.expander.setAttribute('aria-expanded', isExpanded)
    }

    // collapse/expand the settings section; set aria-expanded in the expander control. Default: collapsed
    settingsMenu.expander.addEventListener('click', expandOrCollapseSettings)
    function expandOrCollapseSettings() {
        const settingsExpanded = settingsMenu.container.classList.toggle('expanded')
        settingsMenu.container.classList.toggle('collapsed', !settingsExpanded)
        settingsMenu.expander.setAttribute('aria-expanded', settingsExpanded)
    }
    function setExpanded(target, ...isExpanded) {
        // const expand = isExpanded ||
        target.container.classList.toggle('expanded', isExpanded)
        target.container.classList.toggle('collapsed', !isExpanded)
        target.expander.setAttribute('aria-expanded', isExpanded)
    }

    // toggle on/off (default to 'on')
    let filterIsOn = stored.filterIsOn
    const workslistContainer = $('ol.work.index.group')
    filterMenu.toggle.addEventListener('click', toggleFilterStatus)
    setFilterStatus()

    function toggleFilterStatus() {
        filterIsOn = !filterIsOn
        setFilterStatus()
    }

    function setFilterStatus() {
        GM_setValue('filterIsOn', filterIsOn) // store value
        workslistContainer.classList.toggle('show-priority-filters', filterIsOn) // disable the CSS which hides stories

        // format the toggle button
        filterMenu.toggle.setAttribute('aria-pressed', filterIsOn)
        filterMenu.toggle.classList.toggle('current', filterIsOn)
        filterMenu.toggle.textContent = filterIsOn ? 'On' : 'Off'
    }
    // --------------------------------------------------------------------------------------------------------

    // DEFINE FILTER FIELDS + GETTERS
    class tagBlock { // set elements, get values. If the checkbox is unselected, disable the other fields.
        constructor(includeOrExclude, tagType) {
            const tagBlock = $(`.tpf__tag-block.${includeOrExclude}.${tagType}`)
            this.defaultMatchResult = (includeOrExclude === 'include') // match = true for includes, match = false for excludes
            this.checkboxField = tagBlock.querySelector('input[type=checkbox]')
            this.textareaField = tagBlock.querySelector('.tpf__tag-list')
            this.tagLimitField = tagBlock.querySelector('.tpf__within input')
            this.checkboxField.addEventListener('change', () => {
                const tagBlockEnabled = this.checkboxField.checked
                this.textareaField.readOnly = !tagBlockEnabled
                this.tagLimitField.readOnly = !tagBlockEnabled
            })
        }

        loadFromStorage(storedVals) {
            if (!storedVals) { return }
            this.checkboxField.checked = storedVals.check
            this.textareaField.value = storedVals.pattern
            this.tagLimitField.value = storedVals.tagLim
            this.checkboxField.dispatchEvent(new Event('change')) // apply formatting
        }

        get check() { return this.checkboxField.checked }
        get pattern() { return this.textareaField.value.split(',').map(s => s.trim()) } // TODO clean up line breaks. returns array
        get tagLim() { return this.tagLimitField.value.trim() } // TODO validate numbers (and limit?)

        get isValid() { return this.pattern.length && this.tagLim.length } // ok to save
        get checkTags() { return this.check && this.isValid } // ok to commit
    }

    const characters = new tagBlock('include', 'characters'),
        relationships = new tagBlock('include', 'relationships'),
        excludedCharacters = new tagBlock('exclude', 'characters'),
        excludedRelationships = new tagBlock('exclude', 'relationships')

    // load saved filters and apply (if any are loaded)
    characters.loadFromStorage(stored.characters)
    relationships.loadFromStorage(stored.relationships)
    excludedCharacters.loadFromStorage(stored.excludedCharacters)
    excludedRelationships.loadFromStorage(stored.excludedRelationships)
    $(`.tpf__settings input[value=${stored.format}]`).checked = true

    // add 20ms delay to prevent conflicts with AO3 savior (which runs after a 15ms delay)
    const delay = stored.ao3SaviorIsInstalled ? 20 : 0
    setTimeout(applyFilters, delay)

    const inputTextFields = $$('.tpf__menu :is(input[type="text"], textarea)'),
        checkboxFields = $$('.tpf__menu input[type="checkbox"]')

    // BUTTON: Apply filters
    $('.tpf__apply').addEventListener('click', applyFilters) // MAYBE adapt to multiple buttons

    // BUTTON: Clear filters
    $('.tpf__menu .footnote a').addEventListener('click', () => { // MAYBE also the format selectors?
        for (const field of inputTextFields) { field.value = field.defaultValue }
        for (const field of checkboxFields) {
            field.checked = false
            field.dispatchEvent(new Event('change'))
        }
        showAllWorks()
        GM_deleteValues(['characters', 'relationships', 'excludedCharacters', 'excludedRelationships'])
    })

    function showAllWorks() {
        for (let i = 0; i < works.length; i++) {
            works[i].classList.toggle('hidden-work', false)
        }
    }

    // SETTINGS
    settingsMenu.AO3sav.addEventListener('change', function () { GM_setValue('ao3SaviorIsInstalled', this.checked) })

    // Hide works which don't prioritise your characters/relationships. If filters are off, turn them on.
    function applyFilters() {

        if (!filterIsOn) { toggleFilterStatus() }
        const format = $('input[name="format"]:checked').value

        // Save fields
        function storeVals(tagSet, storeTo) {
            GM_setValue(storeTo, {
                check: tagSet.check,
                pattern: tagSet.pattern,
                tagLim: tagSet.tagLim,
            })
        }
        storeVals(characters, 'characters')
        storeVals(relationships, 'relationships')
        storeVals(excludedCharacters, 'excludedCharacters')
        storeVals(excludedRelationships, 'excludedRelationships')
        GM_setValue('format', format)

        // If no valid characters/relationships are found, exit early (and reveal all)
        if (!characters.checkTags && !relationships.checkTags && !excludedCharacters.checkTags && !excludedRelationships.checkTags) {
            showAllWorks()
            debugLog('No valid filters found!')
            return
        }

        // iterate through works
        for (let i = 0; i < works.length; i++) {

            // If AO3 saviour hid the work, add no further warnings
            if (works[i].classList.contains('ao3-savior-work')) { continue } // go to next work

            // Get first n relationships/characters and check if any are in the user settings   // FIXME - move outside loop? Currently redefining the function for each work!
            function getFirstNTags(tagClassString, includedTagSet, excludedTagSet) {
                const checkTags = (includedTagSet.checkTags || excludedTagSet.checkTags)
                return checkTags && [...works[i].querySelectorAll(tagClassString)]
                    .slice(0, Math.max(includedTagSet.tagLim, excludedTagSet.tagLim)).map(tag => tag.textContent)
            }
            function matchTags(tagSet, tagsToCheck) {
                if (!tagSet.checkTags) { return tagSet.defaultMatchResult } // show work (TRUE) for included tags, hide (FALSE) for excluded
                tagsToCheck = tagsToCheck.slice(0, tagSet.tagLim)
                for (let userTag of tagSet.pattern) {
                    const pattern = (format === 'wildcard') ? wildcardPattern(userTag) : userTag // FIX magic string
                    const rx = RegExp(pattern, 'gi')
                    for (let workTag of tagsToCheck) {
                        if (rx.test(workTag)) { return true }
                    }
                }
                return false
            }
            const firstNchars = getFirstNTags('.characters', characters, excludedCharacters),
                firstNrels = getFirstNTags('.relationships', relationships, excludedRelationships),
                charMatch = matchTags(characters, firstNchars),
                relMatch = matchTags(relationships, firstNrels),
                xCharMatch = matchTags(excludedCharacters, firstNchars),
                xRelMatch = matchTags(excludedRelationships, firstNrels)

            // Show work if it prioritises your tags and none of the blacklisted tags. Otherwise, hide it.
            const foundMatch = relMatch && charMatch && !xRelMatch && !xCharMatch
            debugLog(`foundMatch = ${foundMatch}:
                relMatch = ${relMatch}, charMatch = ${charMatch}
                xRelMatch = ${xRelMatch}, xCharMatch = ${xCharMatch}`)
            works[i].classList.toggle('hidden-work', !foundMatch)
            if (foundMatch) { continue }

            // Add explanation and "show work" button, if it does not already exist
            if (works[i].nextElementSibling?.classList.contains('hide-reasons')) { continue }
            const note = createNewElement('div', 'hide-reasons'),
                div1 = createNewElement('div', 'left', 'This work does not prioritise your preferred tags.'),
                div2 = createNewElement('div', 'right'),
                button = createNewElement('button', 'showwork', 'Show Work')

            button.addEventListener('click', () => { works[i].classList.remove('hidden-work') })
            note.append(div1, div2)
            div2.append(button)
            works[i].after(note)
        }
    }

    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType)
        el.className = className
        el.textContent = textContent
        return el
    }

    // Format wildcard * search pattern (escaping all other special characters)
    function wildcardPattern(pattern) {
        pattern = '^' + pattern
            .replaceAll(/[.+?^=!:${}()|\][/\\]/g, '\\$&')
            .replaceAll('*', '.*')
            + '$'
        return pattern
    }

    const hiderCss = `
        .hide-reasons {
            display: none;
            background-color: red;
        }
        li.hidden-work {
            display: none;
            background-color: orange; /* DEV: works that were previously hidden, but are shown when the filter is off. Will be hidden again when toggle is clicked. */
        }
        li.hidden-work + .hide-reasons {
            border: 1px solid rgb(221,221,221);
            margin: 0.643em 0em;
            padding: 0.429em 0.75em;
            height: 29px;
            background-color: aqua;
            display: block;
        }
        .hide-reasons .left {
            float: left;
            padding-top: 5px;
        }
        .hide-reasons .right {
            float: right;
        }
        
        /*--------------------- TOGGLE FILTER OFF: ---------------------*/
        ol.work.index.group:not(.show-priority-filters) > .hidden-work {
            display: inherit;
        }
        ol.work.index.group:not(.show-priority-filters) > .hide-reasons {
            display: none;
        }`

    GM_addStyle(hiderCss + `
.tpf__menu {
    font-size: 0.9em;

    & h3, h4, dt, dd {
        margin: unset;
    }
    & button {
        margin: 0.25em 0;
    }

    /* SIDEBAR MENU */

    &.tpf__filters {
        background-color: antiquewhite;
        padding: 0.643em;
    }

    & .tpf__filter-head {
        display: flex;
        justify-content: space-between;
        & .expander {
            font-size: 1.2em;
        }
        & #tpf__filter-toggle {
            width:2.5em;
            &.current {
                font-weight: 700;
            }
            &:hover, &:focus-visible {
                color: #900;
                border-top: 1px solid #999;
                border-left: 1px solid #999;
                box-shadow: inset 2px 2px 2px #bbb;
            }
        }
    }
    & .tpf__apply {
        margin: 1em 0;
        &::before { content: "🡆\\00a0" } /*00a0 for nbsp, slash escaped*/
    }
    & #tpf__config-head {
        display: flex;
        justify-content: space-between;
        & .expander {
            font-size: 1.1em;
        }
        & .footnote {
            min-width: fit-content;
        }
    }
    & .tpf__config.expandable {
        background-color: #FCF5EB;
        box-shadow: inset 0px 7px 7px -7px #999;
        padding: 1em 0.5em;
        box-sizing: expandable;
        display: grid;
        row-gap: 0.5em;
        & .save::before { content: "💾" ; float:left }
        & .load::before { content: "🠋" ; text-decoration: underline; float:left}
    }

    & section {
        &.tpf__wrap {
            margin-top: 1.3em;
        }        
        &.tpf__tag-block, &.tpf__wrap .tpf__head {
            margin-bottom: 0.4em;
        }
        &.tpf__settings {
            margin-top: 2em;
        }
    }

    /* MENU ELEMENTS */

    & dt.collapsed + dd.expandable {
        display: none;        
    }
    & .tpf__wrap > .tpf__head {
        padding: 0.1em;
        border-bottom:solid 2px firebrick;
    }
    & textarea:read-only, input[type=text]:read-only {
        background-color: #FCF5EB;
        color: #525252;
    }
    & .tpf__tag-list {
        resize: vertical;
        width: 100%;
        box-sizing: border-box;
        min-height: unset;
        margin-top: 0.15em;
        padding: 0.3em;
        font-family: monospace;
    }
    & .tpf__within {
        display: block;
        text-align: right;
        & .tpf__tag-lim {
            width: 1.1em;
        }
    }
    & fieldset {
        margin: 0 0 0.6em 0;
        box-sizing: border-box;
        width: 100%;
        box-shadow: inset 0 1px 2px #ccc; /*mimic AO3 textboxes*/
        background-color: #FCF5EB;
        & .question {
            width: unset;
            font-size: 1em;
            vertical-align:text-top;
            float: right;
        }
    }
    & label {
        white-space: nowrap;
    }
    & .explanatory-text {
        display: block;
        font-size: 0.8em;
        margin-left: 2em;
        line-height: 1.1em;
        color: #525252;
    }
    & .actions button {
        box-sizing: border-box;
        width: 100%;
        height: auto;
    }
    & .question {
        padding:0 0.425em;
        margin: 0 1px;
        border: 1px solid;
        border-radius: 0.75em;
        font-size: 0.75em;
        vertical-align: super;
        cursor: help;
        font-family: Georgia, serif;
        font-weight: bold;
    }
    & .footnote {
        padding-right: unset;
    }
}`)

    function debugLog(input) {
        if (enableVerboseLogging) { console.log(input) }
    }

})()
