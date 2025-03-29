// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.5
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
        [ ] 5. Test with multiple open sheets

        [ ] 6. (IMPORTANT) Format copied text to account for traits & source
        [ ] 7. Handle items (lower priority - maybe just hide copy button in the modal, for now)

POLISH (late-game steps)
        [ ] design (upload?) a subtle "copy" button to match the Pathbuilder theme
        [ ] add action icons after the title ◇◆↩︎
        [ ] add a visual indicator when the copy succeeds (HTML5 on the button?)
        [ ] make work with light AND dark styles
        [ ] optional setting: in sidebar, hide the copy button until you reveal the feat contents.
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

        // SHEET: Check if tab, character level or features change (which recreates the content of the tabbed display area)
        const selectedTab = document.querySelector('.tabbed-area-menu .section-menu.section-menu-selected').textContent
        const tabsWithFeatures = ['Spells', 'Feats', 'Actions']

        const tabbedAreaObserver = new MutationObserver(function() {
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
                    }
                }
            }
        )
        modalObserver.observe (document.body, {childList:true})
    }
    // FIXME: this also creates a button in the item description. The relevant div is not found, so copying fails.
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

    // define, assign & format the feature text (expected parameter: block containing title and detail elements)
    class featText {
        constructor(featBlock) {
            this.Title = featBlock.querySelector('.listview-title').textContent
            // actionIcon
            // level
            this.Traits = [...featBlock.querySelectorAll('span.trait')].map((el) => el.textContent).join(", ")
            const detailsChildEls = featBlock.querySelector('.listview-detail').children // 3 children:
            this.Details = detailsChildEls.item(1).textContent
            // source
        }
        formatted() {// TODO fix spacing
            return `** ${this.Title} **\n\
            ${this.Details}`
        }
    }

    /*----------------------------------------------------------------------------------------------*/
    function rmIndentSpaces (stringWithSpaces) {
        return stringWithSpaces.replaceAll(/[ ]{4}/,'')
    }
    
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