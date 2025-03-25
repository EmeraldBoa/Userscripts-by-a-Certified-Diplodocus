// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.2
// @description  Adds a copy button to Pathbuilder's feat, feature and item descriptions.
// @author       CertifiedDiplodocus
// @match        http*://pathbuilder2e.com/app.html*
// @icon         https://pathbuilder2e.com/favicon.ico
// @license      GPL-3.0-or-later
// @grant        GM_addStyle
// ==/UserScript==
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
        [ ] 3. Add MutationObserver for
                [-] feats
                [-] actions
                [-] sidebar
                (note: if a section appears, disappears and reappears - will the buttons have to be recreated, or not?)
        [ ] 4. Add MutationObserver for popup windows

POLISH (late-game steps)
        [ ] design (upload?) a subtle "copy" button to match the Pathbuilder theme
        [ ] add action icons after the title ◇◆↩︎
        [ ] add a visual indicator when the copy succeeds (HTML5 on the button?)
        [ ] make work with light AND dark styles
        [ ] optional setting: in sidebar, hide the copy button until you reveal the feat contents.
----------------------------------------------------------------------------------------------------------------------*/

(function() {
    'use strict';

    // wait for the user to load a character sheet
    const sheetObserver = new MutationObserver (()=>{
        const sheetIsVisible = document.getElementById('main-container').offsetParent //https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
        if (sheetIsVisible) {
            sheetObserver.disconnect()
            modifyCharSheet()
        }
    })
    sheetObserver.observe (document.body, {childList: true})

    function modifyCharSheet() {

        // SIDEBAR: Get feature elements and loop through them
        const features = document.querySelectorAll('.listview-item')
        for (const featBlock of features) { // for NodeLists, use for...of
            
            const topDiv = featBlock.querySelector('.top-div.listview-topdiv')
            const featText = {
                Title: topDiv.querySelector('.listview-title').textContent,
                Info: featBlock.querySelector('.listview-detail').textContent
            }
            const formattedFeatText = '**' + featText.Title + '**\n' + featText.Info

            // Create and append a button
            const copyButton = createButton ('div', 'div-button-simple copy-button', function(event) {
                event.stopPropagation() // stop from bubbling
                copyToClipboard(formattedFeatText)
            })
            topDiv.append(copyButton)
        }
    }    

    // TODO: in the feats section, topDiv.prepend

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
        newButton.addEventListener ('click', callbackFunction, false)
        return newButton
    }

    GM_addStyle (`
    .copy-button {
        color: #2d4059;
        border: none;
    }
    .copy-button:hover {
        color: #ff5722;
        border: none;
    }
    `)
    //.listview-title:hover // TODO inherit this? maybe use the .listview-title class, and override unwanted settings (+cursor)

})();