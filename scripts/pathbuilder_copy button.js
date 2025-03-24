// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.1
// @description  Adds a copy button to Pathbuilder's feat, feature and item descriptions.
// @author       CertifiedDiplodocus
// @match        http*://pathbuilder2e.com/app.html*
// @icon         https://pathbuilder2e.com/favicon.ico
// @license      GPL-3.0-or-later
// @grant        none
// @run-at       document-start 
// ==/UserScript==

//TODO: don't use document-start in header! may not need first MutationObs?

/* DONE:
        [x] identify location
        [x] jquery or not? NOT. Do I want to use it?
        [x] create simple button & add to page
        [x] add copy code

TODO: now make it work with all elements

Steps: 
        [ ] 1. Test adding button to feats page
        [ ] 2. Test on sidebar

POLISH (late-game steps)
        [ ] design (upload?) a subtle "copy" button to match the Pathbuilder theme
        [ ] add action icons after the title ◇◆↩︎
        [ ] add a visual indicator when the copy succeeds (HTML5 on the button?)
----------------------------------------------------------------------------------------------------------------------*/

(function() {
    'use strict';

    // wait for body to load
    const docObserver = new MutationObserver (() => {
        if (document.body) {
            buildSheetObserver()
            docObserver.disconnect()    // TODO: will it break if I put this first? If yes, then put the disconnect in the next function.
        }
    })
    docObserver.observe (document.documentElement, {childList: true})

    // wait for the user to load a character sheet
    function buildSheetObserver() {
        const sheetObserver = new MutationObserver (()=>{
            const sheetIsVisible = document.getElementById('main-container').offsetParent //https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
            if (sheetIsVisible) {
                modifyCharSheet()
                sheetObserver.disconnect() // TODO: will it break if I put this first? If yes, then put the disconnect in the next function.
            }
        })
        sheetObserver.observe (document.body, {childList: true})
    }

    // done! run the rest of the script.
    function modifyCharSheet() {

        // Character sheet section ----------------------------
        // Feats tab
        const featBlock = document.querySelector('.listview-item')
        const featNameDiv = featBlock.querySelector('.top-div.listview-topdiv')
        //const featNameDiv = document.querySelectorAll('.top-div.listview-topdiv')
        
        const featText = { // TODO maybe include the action icons (emoji? ◇◆↩︎)
            Title: featBlock.querySelector('.listview-title').textContent,
            Info: featBlock.querySelector('.listview-detail').textContent
        }
        const formattedFeatText =`**${featText.Title}**
        ${featText.Info}`;

        // Make button
        const buttonTest = createButton ('div', 'div-button-simple copy-button', function(event) {
            event.stopPropagation() // stop from bubbling
            copyToClipboard(formattedFeatText)
        })
        featNameDiv.appendChild(buttonTest)
    }

    //for...of (for nodelists like queryselectorall)

/*----------------------------------------------------------------------------------------------*/
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('failed to copy to clipboard'); // MAYBE: remove try/catch
        }
    }

    // Create a button with an event listener
    function createButton (elementType, buttonClass, callbackFunction) {
        const newButton = document.createElement (elementType)
        newButton.className = buttonClass
        newButton.textContent = '📋︎' // 📋📋︎
        newButton.style.color = '#2d4059'
        newButton.addEventListener ('click', callbackFunction, false)
        return newButton
    }

})();