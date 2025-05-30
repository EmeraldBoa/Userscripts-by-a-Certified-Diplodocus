// ==UserScript==
// @name         Header to get userscript/eslint to stop complaining
// @version      0.0
// @description  TEST filter menu in search pages
// ==/UserScript==

'use strict'
const $ = document.querySelector.bind(document) // shorthand for readability
const $$ = document.querySelectorAll.bind(document)

// HEAD: ------------------------------------------
// collapse/expand; set aria-expanded in the expander control
const filterMenu = {
    container: $('.tpf__filter-head'),
    expander: $('.tpf__filter-head .expander'),
    toggle: $('#tpf__filter-toggle'),
}
filterMenu.expander.addEventListener('click', () => {
    const isExpanded = filterMenu.container.classList.toggle('expanded')
    filterMenu.container.classList.toggle('collapsed')
    filterMenu.expander.setAttribute('aria-expanded', isExpanded)
})

// toggle on/off (default to 'on')
let filterIsOn = true
filterMenu.toggle.addEventListener('click', setFilterStatus)

function setFilterStatus() {
    filterIsOn = !filterIsOn

    // format the toggle button
    filterMenu.toggle.setAttribute('aria-pressed', filterIsOn)
    filterMenu.toggle.classList.toggle('current', filterIsOn)
    filterMenu.toggle.textContent = filterIsOn ? 'On' : 'Off'
}
// ENABLE / DISABLE FILTER LISTS ----------------------------------
// select elements, disable (read-only) if the checkbox is unselected
class tagBlock {
    constructor(includeOrExclude, tagType) {
        const tagBlock = $(`.tpf__tag-block.${includeOrExclude}.${tagType}`)
        this.checkbox = tagBlock.querySelector('input[type=checkbox]')
        this.filterTextbox = tagBlock.querySelector('.tpf__tag-list')
        this.tagLimit = tagBlock.querySelector('.tpf__within input')
        this.checkbox.addEventListener('change', () => {
            const tagBlockEnabled = this.checkbox.checked
            this.filterTextbox.readOnly = !tagBlockEnabled
            this.tagLimit.readOnly = !tagBlockEnabled
        })
    }
}

// get info  when called (// MAYBE just 'get' calls inside the previous class?)
class tagInfo {
    constructor(someTagBlock) {
        this.check = someTagBlock.checkbox.checked
        this.pattern = someTagBlock.filterTextbox.textContent
            .trim().filter(Boolean) // TODO clean up line breaks
        this.tagLim = someTagBlock.tagLimit.textContent
            .trim().filter(Boolean) // TODO validate numbers (and limit?)
    }

    get isValid() { // ok to save
        return this.pattern.length && this.tagLim.length
    }

    get checkTags() { // ok to commit
        return this.check && this.isValid
    }
}
const els = {
    includeChars: new tagBlock('include', 'characters'),
    includeRels: new tagBlock('include', 'relationships'),
    excludeChars: new tagBlock('exclude', 'characters'),
    excludeRels: new tagBlock('exclude', 'relationships'),
}

// Submit button
$('#tpf__apply').addEventListener('click', applyFilters)

function getFilterInfo() {

    // get the variables
    const characters = new tagInfo(els.includeChars),
        relationships = new tagInfo(els.includeRels),
        excludedCharacters = new tagInfo(els.excludeChars),
        excludedRelationships = new tagInfo(els.excludeRels)

    // validation: If no valid characters/relationships are found, exit early
    if (!characters.checkTags && !relationships.checkTags && !excludedCharacters.checkTags && !excludedRelationships.checkTags) { return }

    // TODO : AO3 timer (old code)
    runEverything()
    function runEverything() {

        // iterate through works
        const works = $('.work.blurb')
        for (let i = 0; i < works.length; i++) {

            // If AO3 saviour hid the work, add no further warnings
            if (works[i].classList.contains('ao3-savior-work')) { continue } // go to next work

            // Get first n relationships/characters and check if any are in the user settings
            function getFirstNTags(tagClassString, includedTagSet, excludedTagSet) {
                const checkTags = (includedTagSet.checkTags || excludedTagSet.checkTags)
                return checkTags && [...works[i].querySelectorAll(tagClassString)]
                    .slice(0, Math.max(includedTagSet.tagLim, excludedTagSet.tagLim)).map(tag => tag.textContent)
            }
            function matchTags(tagSet, tagsToCheck) {
                return tagSet.checkTags && isMatch (tagsToCheck, tagSet.tagLimit, tagSet.pattern)
            }
            const firstNrels = getFirstNTags('.relationships', relationships, excludedRelationships),
                firstNchars = getFirstNTags('.characters', characters, excludedCharacters),
                relMatch = matchTags (relationships, firstNrels),
                charMatch = matchTags (characters, firstNchars),
                xRelMatch = matchTags (excludedRelationships, firstNrels),
                xCharMatch = matchTags (excludedCharacters, firstNchars)

            // Hide works which don't prioritise your characters/relationships. Add explanation and "show work" button.
            if ((relMatch || charMatch) && !(xRelMatch || xCharMatch)) { continue } // skip if at least one match and no blacklist
            works[i].classList.add('hiddenwork')

            const note = createNewElement('div', 'hidereasons'),
                div1 = createNewElement('div', 'left', 'This work does not prioritize your preferred tags.'),
                div2 = createNewElement('div', 'right'),
                button = createNewElement('button', 'showwork', 'Show Work')

            button.addEventListener(
                'click', function () {
                    works[i].classList.remove('hiddenwork')
                    note.remove()
                })
            note.append(div1, div2)
            div2.append(button)
            works[i].after(note)
        }
    }
    //
}

// old code below:

function applyFilters() {

}

/** FUNCTIONS */

function createNewElement(elementType, className, textContent) {
    const el = document.createElement(elementType)
    el.className = className
    el.textContent = textContent
    return el
}

function isMatch(tagList, tagLim, userList) {
    tagList = tagList.slice(0, tagLim)
    for (let userTag of userList) {
        const pattern = config.useRegex ? userTag : wildcardPattern(userTag)
        const rx = RegExp(pattern, 'gi')
        for (let workTag of tagList) {
            if (rx.test(workTag)) { return true }
        }
    }
    return false
}

// Format wildcard * search pattern (escaping all other special characters)
function wildcardPattern(pattern) {
    pattern = '^' + pattern
        .replaceAll (/[.+?^=!:${}()|\][/\\]/g, '\\$&')
        .replaceAll ('*', '.*')
        + '$'
    return pattern
}
