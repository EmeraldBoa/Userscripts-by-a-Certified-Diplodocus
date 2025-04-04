// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.5.2
// @description  Adds a copy button to Pathbuilder's feature and action descriptions.
// @author       CertifiedDiplodocus
// @match        http*://pathbuilder2e.com/app.html*
// @icon         https://pathbuilder2e.com/favicon.ico
// @license      GPL-3.0-or-later
// @grant        GM_addStyle
// ==/UserScript==

/* eslint-disable no-fallthrough */

/*
DONE:
        [x] identify location
        [x] jquery or not? NOT. Do I want to use it?
        [x] create simple button & add to page
        [x] add copy code

TODO: now make it work with all elements

Steps:
        [x] 1. Test adding button to feats page
        [x] 2. Test on sidebar
        [x] 3. Add MutationObserver for
                [x] feats
                [x] actions
                [x] spells
                    [x]] > rituals! impulses! there may be more tabs for different classes...
                [x] sidebar during updates!

        [x] 3b. Rejigger with promises (or fix region position)
        [x] 4. Add MutationObserver for popup windows
                [x] get button to copy the currently open text, not the text when the button was created

        [ ] 5. Format copied text to account for traits & source
                [x] features, classes, feats
                [ ] items
        [x] 6. Test with multiple open sheets
            (Works, but mutation observers fires for the hidden tabs too - though not visible in the HTML. //HACK?)
        [ ] 7. Handle items (lower priority - maybe just hide copy button in the modal, for now)

POLISH (late-game steps)
        [ ] design (upload?) a subtle "copy" button to match the Pathbuilder theme
        [ ] add action icons after the title ◇◆↩︎
        [ ] make work with light AND dark styles
        [ ] optional setting: in sidebar, hide the copy button until you reveal the feat contents.
        [x] convert formatted descriptions (with inline html) to markdown (see copy script)
        [ ] format as template
---------------------------------------------------------------------------------------------------------------------- */

(function () {
    'use strict'

    // wait for the user to load a character sheet
    const sheetObserver = new MutationObserver (()=>{
        const sheetIsVisible = document.getElementById('main-container').offsetParent // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
        if (sheetIsVisible) {
            sheetObserver.disconnect()
            addFeatureObservers()
        }
    })
    sheetObserver.observe (document.body, {childList: true})

    function addFeatureObservers() {

        // define the selectors for the different page regions
        const region = {
            Sidebar: {
                element: document.querySelector('#divBuildLevels'),
                placeButton (targetLocation, button) {targetLocation.append(button)}
            },
            Sheet: {
                element: document.querySelector('.tabbed-area-display-holder'),
                placeButton (targetLocation, button) {targetLocation.prepend(button)}
            }
        }

        // SIDEBAR: when any features change/are added, the entire sidebar resets, so re-add buttons
        addButtonToEachFeature(region.Sidebar)
        const sidebarObserver = new MutationObserver(() => addButtonToEachFeature(region.Sidebar))
        sidebarObserver.observe (region.Sidebar.element, {childList:true, subtree:true})

        // SHEET: Check if tab, character level or features change (which resets the content of the tabbed display area)
        const tabsWithFeatures = ['Spells', 'Feats', 'Actions']

        const tabbedAreaObserver = new MutationObserver(function() {
            const selectedTab = document.querySelector('.tabbed-area-menu .section-menu.section-menu-selected').textContent
            if (!tabsWithFeatures.includes(selectedTab)) {return;}
            console.log('On a valid tab! Adding buttons')
            addButtonToEachFeature(region.Sheet)
        })
        tabbedAreaObserver.observe (region.Sheet.element, {childList:true, subtree:true})

        // MODAL: if the modal window is opened, add a "copy" button to its menu
        const modalObserver = new MutationObserver(
            function(mutationList) {
                for (const mutation of mutationList) {
                    if (!mutation.type === 'childList') {console.log('this shouldn\'t happen, right?'); continue;}
                    for (const addedNode of mutation.addedNodes) {
                        if (!addedNode.type === 1) {continue;} // elements only
                        if (addedNode.id === 'root') {addButtonToModal()}
                        /* BUG. To reproduce:
                            1. open a normal modal, e.g. feats
                            2. click on a trait. A second modal window appears (new div#root!)
                            3. button will be added to the FIRST modal. Keep doing so, more buttons are added
                        Proposed solution: add a parameter specifying the modal in question
                        */
                    }
                }
            }
        )
        modalObserver.observe (document.body, {childList:true})
    }
/* FIXME: this also creates a button in the item description. The relevant div is not found, so copying fails. DISABLE if items are displayed.
    - class, ancestry, feat: accept/cancel/prd
        div#content > .div-listview-scroller
                        .div-listview-info > .div-info-lm-box > .top-div.listview-topdiv > (title)
                                                                .listview-detail > traits, description, source (3 unclassed divs)
    - armour-change/weapons-change/add gear: buy/give/cancel/prd/custom
        div#content > .div-listview-scroller
                        .div-listview-info > .div-info-lm-box > .top-div.listview-topdiv > (title)
                                                                .listview-detail > traits, description, source (3 unclassed divs)
    - runes: buy/give/cancel/prd/potency/resilient
        div#content > .div-listview-scroller
                        .div-listview-info > .div-info-lm-box > .top-div.listview-topdiv > (title)
                                                                .listview-detail > traits, description, source (3 unclassed divs)
    - add gear: buy/give/cancel/prd/custom (problem: more than one can be selected. IDEA: disable/grey out copy button if this is the case?)
        div#content > .div-listview-scroller
                        .div-listview-info >   .listview-item > .top-div.listview-topdiv > (title)
                                                                .listview-detail > traits, description, source (3 unclassed divs)
    ---------------------------------------------------------------------------
    - weapons/armour options: accept/cancel
        div#content > .scrollable > .layout-item(4th) - not all traits, just crit spec and text. Maybe best omitted
    - gear tab: equipment info: accept/cancel
        div#content > .scrollable > .listview-item >            .top-div.listview-topdiv > (title)
                                                                .listview-detail > description (1st div)
    ---------------------------------------------------------------------------
    - trait description: accept
        div.modal-content > dialog-top-bar (title)                      ... this is the container for all the other modals
                            2nd child div (sibling to title div) (desc)
                                                            
Selectors for (descriptions with traits)
    - feats, classes, ancestries:   '.div-listview-info > .div-info-lm-box'
    - armour/weapons/runes shops:   '.div-listview-info > .div-info-lm-box'
    - gear shop:                    '.div-listview-info > .listview-item'     (more than 1 .listview-item may exist)
In all cases, title = '.top-div.listview-topdiv>.listview-title' and traits/desc/source are in 3 divs within '.listview-detail'
Note: it is possible for the box to be blank (.div-listview-info exists, > .div-info-lm-box does not)
---------------------------------------------------------------------------
Selectors for item descriptions (title + descriptions only)   
    - weapon/armour options:        '.scrollable > .layout-item:nth-of-type(3)'     ... traits are hard to get, but info on crit spec
    - gear tab description click:   '.scrollable > .listview-item'                  ... same title/info selectors!
---------------------------------------------------------------------------
If no other selector works, then, it's the trait dialog
    - trait:                        '.modal-content' 

  */
 const elSelectors = {
    feat: '.div-listview-info > .div-info-lm-box',
    shop: '.div-listview-info > .div-info-lm-box',
    gearMultiselect: '.div-listview-info > .listview-item',
    weaponArmourOptions: '.scrollable > .layout-item:nth-of-type(3)',
    gearDesc: '.scrollable > .listview-item'
 }

    // MODAL COPY BUTTON (bottom right). On click, copy the text which is currently open.
    function addButtonToModal () {
        const copyButton = createButton('div', 'modal-button copy-button-modal', 'Copy', function () {
            const featureInfo = document.querySelector('.div-info-lm-box')
            const formattedFeatText = new featText(featureInfo).formatted()
            copyToClipboard(formattedFeatText)
        })
        document.querySelector('.modal-buttons').append(copyButton)
    }

    // SHEET BUTTONS. Get feature elements, loop through them and add a button (position dependent on page section)
    function addButtonToEachFeature (pageRegion){
        const features = pageRegion.element.querySelectorAll('.listview-item:not(.has-copybutton)')
        for (const featBlock of features) {
            const formattedFeatText = new featText(featBlock).formatted()

            // Create and append a button
            const copyButton = createButton ('div', '.div-button-simple copy-button-main', '📋︎', function(event) { // 📋📋︎
                event.stopPropagation() // prevent bubbling (keep feature text open)
                copyToClipboard(formattedFeatText)
            })

            const topDiv = featBlock.querySelector('.top-div.listview-topdiv')
            pageRegion.placeButton(topDiv, copyButton)
            featBlock.classList.add('has-copybutton') // ensure button is only added once // MAYBE unnecessary now? could deactivate/reactivate observer instead
        }
    }

    function getActionIcon(imgUrl) {
        if (!imgUrl) {return}
        for (const action in actionSymbols){
            if (imgUrl.includes(action)) {return actionSymbols[action]}
        }
    }
    const actionSymbols = {
        reaction: '↩︎',
        action_free: '◇',
        action_single: '◆',
        action_double: '◆◆'
    }

    // define, assign & format the feature text (expected parameter: block containing title and detail elements)
    /* SIDEBAR: 
        - show ActionIcons if they exist
        - get level from the sidebar (<aside aria-label="Level 18 Options">) - maybe iterate through sidebar sections?
        - get traits if they exist
        
    */
    class featText {
        constructor(featBlock) {
            // handle elements which don't exist (e.g. feat with no actions) with the optional chaining operator (?.)
            const topDiv = featBlock.querySelector('.top-div.listview-topdiv')
            this.Title = topDiv.querySelector('.listview-title').textContent
            this.ActionIcon = getActionIcon(topDiv.querySelector('.action-icon')?.src)
            this.Level = topDiv.querySelector('listview-item-level')?.textContent
            const details = featBlock.querySelector('.listview-detail') // 3 children:
            this.Traits = [...details.querySelectorAll('span.trait')].map((el) => el.textContent).join(", ")
            this.Details = details.children.item(1).innerHTML // get formatted text
            this.Source = details.querySelector('.copyright')?.textContent
        }
        formatted() {
            const level = this.Level ? ` [${this.Level}]` : ''
            const line1 = `**${this.Title}** ${this.ActionIcon ?? ''}${level}`
            const line2 = this.Traits ? `*${this.Traits}*` : ''
            const line3 = htmlToMarkdown(this.Details)
            const line4 = this.Source ? `\`${this.Source}\`` : ''
            return [line1, line2, line3, line4].filter(Boolean).join('\n')
        }
    }

    // function to convert HTML tags to markdown
    function htmlToMarkdown(formattedText) {
        if (!formattedText.includes('<')) { return formattedText } // check for presence of tags
        const rx = {
            break: RegExp(/<br\s*[\/]?>/gi),
            bold: RegExp(/<[\/]?b>/gi),
            italic: RegExp(/<[/]?i>/gi),
            subtitleDivs: RegExp(/<div class="subtitle".+>|<\/div>/gi)
        }
        formattedText = formattedText
            .replaceAll(rx.subtitleDivs, '')
            .replaceAll(rx.break, '\n')
            //TODO handle <p> - unexpectedly used in some places!
            .replaceAll(/[\n]{3,}/gi, '\n\n') // max two linebreaks. //FIXME May not work if there is whitespace - test?
            .replaceAll(rx.bold, '**')
            .replaceAll(rx.italic, '*')
        return formattedText
    }

    /*----------------------------------------------------------------------------------------------*/
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('failed to copy to clipboard'); // TODO remove try/catch once development is finished
        }
    }

    // Create a button with an event listener //MAYBE: hardcode 'div'
    function createButton (elementType, buttonClass, buttonText, callbackFunction) {
        const newButton = document.createElement (elementType)
        newButton.className = buttonClass
        newButton.textContent = buttonText
        newButton.addEventListener ('click', callbackFunction, false)
        return newButton
    }

    // TODO get colours from page style (match dark/light)
    GM_addStyle (`
    .copy-button-main {
        color: #2d4059;
        border: none;
    }
    .copy-button-main:hover {
        color: #ff5722; 
        border: none;
    }
    .copy-button-modal {
        float: right;
    }
    `)
    //.listview-title:hover // TODO inherit this? maybe use the .listview-title class, and override unwanted settings (+cursor)

})();

// Unused functions ----------------------------------------------------------------------------------------
function formatToMarkdown (title, details, actionIcon, traits, source, level) {
    // if variable is unassigned, return unassigned, otherwise format
    title &&= `**${title}**` // assign only if left is truthy (will fail if left = 0!)
    actionIcon &&= ` ${actionIcon}`
    traits &&= traits + '\n'
    source &&= `*${source}*`
    level &&= `[${level}]`
    return [title, traits, details, source].filter(Boolean).join('\n')
}