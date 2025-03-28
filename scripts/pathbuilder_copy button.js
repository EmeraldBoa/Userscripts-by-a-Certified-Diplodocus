// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.4
// @description  Adds a copy button to Pathbuilder's feat, feature and item descriptions.
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

        [ ] 3b. Rejigger with promises (or fix region position)

        [ ] 4. Add MutationObserver for popup windows
        [ ] 5. Test with multiple open sheets

        [ ] 6. (IMPORTANT) Format copied text to account for traits & source

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

        // define the selectors for the different page regions
        // MAYBE make a class with properties "element" and "buttonPos" - or define a method within the object?
        const region = {
            Sidebar: document.querySelector('#divBuildLevels'),
            Sheet: document.querySelector('.tabbed-area-display-holder'),
        }

        // SIDEBAR: when any features change/are added, the entire sidebar resets, so re-add buttons
        addButtons(region.Sidebar)
        const sidebarObserver = new MutationObserver(() => addButtons(region.Sidebar))
        sidebarObserver.observe (region.Sidebar, {childList:true, subtree:true})

        // SHEET: Check if tab, character level or features change (which recreates the content of the tabbed display area)
        const tabbedAreaObserver = new MutationObserver(function() {
            if (!currentTabIsValid) {return;}
            console.log('On a valid tab! Adding buttons')
            addButtons(region.Sheet)
        })
        tabbedAreaObserver.observe (region.Sheet, {childList:true, subtree:true})

        function currentTabIsValid() {
            let selectedTab = document.querySelector('.tabbed-area-menu .section-menu.section-menu-selected').textContent
            return selectedTab==='Spells' && selectedTab==='Feats' && selectedTab==='Actions'
        }
        
        // Get feature elements, loop through them and add a button (position dependent on page section)
        function addButtons (pageRegion){
            const features = pageRegion.querySelectorAll('.listview-item:not(.has-copybutton)')
            for (const featBlock of features) {
                const topDiv = featBlock.querySelector('.top-div.listview-topdiv')
                const featText = {
                    Title: topDiv.querySelector('.listview-title').textContent,
                    Info: featBlock.querySelector('.listview-detail').textContent
                }
                const formattedFeatText = '**' + featText.Title + '**\n' + featText.Info

                // MAYBE: if no other buttons are needed, simplify the function
                // Create and append a button
                const copyButton = createButton ('div', 'div-button-simple copy-button', function(event) {
                    event.stopPropagation() // stop from bubbling // MAYBE custom method for clarity?
                    copyToClipboard(formattedFeatText)
                })

                if (pageRegion===region.Sidebar) {
                    topDiv.append(copyButton)
                } else {
                    topDiv.prepend(copyButton)
                }
                featBlock.classList.add('has-copybutton') // ensure button is only added once
            }
        }
    } 
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

    // TODO get colours from page style (match dark/light)
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