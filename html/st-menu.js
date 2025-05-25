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
    container: $('.st-menu .filter-toggle'),
    expander: $('.st-menu .expander'),
    filterToggle: $('#st-filter-toggle'),
}
filterMenu.expander.addEventListener('click', () => {
    const isExpanded = filterMenu.container.classList.toggle('expanded')
    filterMenu.container.classList.toggle('collapsed')
    filterMenu.expander.setAttribute('aria-expanded', isExpanded)
})

// toggle on/off
let filterIsOn = true
filterMenu.filterToggle.addEventListener('click', setFilterStatus)

function setFilterStatus() {
    filterIsOn = !filterIsOn

    // format the toggle button
    filterMenu.filterToggle.setAttribute('aria-pressed', filterIsOn)
    filterMenu.filterToggle.classList.toggle('current', filterIsOn)
    filterMenu.filterToggle.textContent = filterIsOn ? 'On' : 'Off'
}
// ENABLE / DISABLE FILTER LISTS ----------------------------------
// select elements, disable (read-only) if the checkbox is unselected
class tagBlock {
    constructor(includeOrExclude, tagType) {
        const tagBlock = $(`.tag-block.${includeOrExclude}.${tagType}`)
        this.checkbox = tagBlock.querySelector('input[type=checkbox]')
        this.filterTextbox = tagBlock.querySelector('.tag-list')
        this.tagLimit = tagBlock.querySelector('.within input')
        this.checkbox.addEventListener('change', () => {
            const tagBlockEnabled = this.checkbox.checked
            this.filterTextbox.readOnly = !tagBlockEnabled
            this.tagLimit.readOnly = !tagBlockEnabled
        })
    }
}
const filterEls = {
    includeChars: new tagBlock('include', 'characters'),
    includeRels: new tagBlock('include', 'relationships'),
    excludeChars: new tagBlock('exclude', 'characters'),
    excludeRels: new tagBlock('exclude', 'relationships'),
}

// Submit button
$('#tpf-apply').addEventListener('click', applyFilters)

/**
 * GET INPUT FROM FIELDS
 */

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

function getFilterInfo() {

    // get the variables
    const characters = new tagInfo(filterEls.includeChars),
        relationships = new tagInfo(filterEls.includeRels),
        excludedCharacters = new tagInfo(filterEls.excludeChars),
        excludedRelationships = new tagInfo(filterEls.excludeRels)

    // validation: If no valid characters/relationships are found, exit early
    if (
        !characters.checkTags && !relationships.checkTags && !excludedCharacters.checkTags && !excludedRelationships.checkTags
    ) { return }

}

function doStuff() {
    
}