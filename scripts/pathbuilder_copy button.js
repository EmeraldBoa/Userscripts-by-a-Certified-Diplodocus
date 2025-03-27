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
        [ ] 3. Add MutationObserver for
                [-] feats
                [-] actions
                [-] spells > rituals! impulses! there may be more tabs for different classes...
                [x] sidebar > is hidden, not removed
                (note: if a section appears, disappears and reappears - will the buttons have to be recreated, or not?)

                - Option 1) Watch the tabs to see if the class changes. If .section-menu-selected = Spells, Feats or Actions
                            then add buttons
                - Option 2) Watch the divs. If they are changed, then add buttons (regardless)

        [ ] 3b. Rejigger with promises (or fix region position)

        [ ] 4. Add MutationObserver for popup windows
        [ ] 5. Test with multiple open sheets

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
        const region = {
            Sidebar: document.querySelector('#divBuildLevels'),
            Sheet: document.querySelector('.tabbed-area-display-holder'), // I think .tabbed-area-display is removed and recreated: could be useful!
        }

        addButtons(region.Sidebar)

        // Add MutationObserver to the main sheet
        // [ ] one observer > if .textContent = 'spells|feats|actions' then DoStuff, or...
        // [x] three observers > one callbackFunction

        // Create an observer for the main navbar (Weapons/Defense/Gear...)
        const navBar = document.querySelector('.tabbed-area-menu')
        const navBarObserver = new MutationObserver (navBarAction)
// FIXME: this doesn't work (outer navbar + childList)...
        navBarObserver.observe(navBar, {attributeFilter:['class'], childList:true})
// FIXME: but this does (single item)
        navBarObserver.observe(navBar.children.item(3), {attributeFilter:['class']})
        navBarObserver.observe(navBar.children.item(6), {attributeFilter:['class']})
        navBarObserver.observe(navBar.children.item(7), {attributeFilter:['class']})

         // BUG: need to disconnect the individual tab here, or the observer will keep adding buttons whenever I reselect the tab. 
         // possible alternate solution: add buttons only when the item doesn't have a button. Modify the title class to .hasButton, and ignore those?
         // Which solution works best with my eventual plan to add buttons whenever features are added to the sheet?
         // Adding a feature RECREATES the tabbed-area-display.
         // Does this happen when I change tabs for the first time?
        function navBarAction (mutationList, observer) {
            for (const mutation of mutationList) {
                if (!mutation.target.classList.contains('section-menu-selected')) {continue;}
                switch(mutation.target.textContent) {
                    case 'Spells':
                        console.log('Spells selected! Adding observer')
                    case 'Feats':
                    case 'Actions':
                        console.log('Changed to a valid tab! Adding buttons')
                        addButtons(region.Sheet)
                }
            }
        }

        // Get feature elements, loop through them and add a button (position dependent on page section)
        function addButtons (pageRegion){
            const features = pageRegion.querySelectorAll('.listview-item')
            for (const featBlock of features) {
                const topDiv = featBlock.querySelector('.top-div.listview-topdiv')
                const featText = {
                    Title: topDiv.querySelector('.listview-title').textContent,
                    Info: featBlock.querySelector('.listview-detail').textContent
                }
                const formattedFeatText = '**' + featText.Title + '**\n' + featText.Info

                // Create and append a button // MAYBE: if no other buttons are needed, simplify the function
                const copyButton = createButton ('div', 'div-button-simple copy-button', function(event) {
                    event.stopPropagation() // stop from bubbling // MAYBE custom method for clarity?
                    copyToClipboard(formattedFeatText)
                })
                if (pageRegion===region.Sidebar) {
                    topDiv.append(copyButton)
                } else {
                    topDiv.prepend(copyButton)
                }
            }
        }

        function getElementByTextContent(context, selector, text) {
            const elements = context.querySelectorAll(selector)
                .filter((el) => (el.textContent || '') === text)
            return elements
        }

        // MAYBE: pre-select the menu items with xPath (robustness in case a script or page update changes the item(i) number)
        //const navBar = document.querySelector('.tabbed-area-menu')
        const navSpellsTest = getElementByXpath('//div[text()="Spells"]', navBar)

        function getElementByXpath(xpath, context) {
            return document
                        .evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        .singleNodeValue;
        }    
    } 
        // note: I replaced "document" with the parameter "context". Not yet tested.  
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

/*
        // for multiple small observers
        const navBar1 = document.querySelector('.tabbed-area-menu')
        const navSpells = navBar1.children.item(3),
              navFeats = navBar1.children.item(6),
              navActions = navBar1.children.item(7) // FIXME: not semantic, thus vulnerable to changes in the menu order. XPath?
        const navBarObserver = new MutationObserver (navBarAction)
        navBarObserver.observe(navSpells, {attributeFilter:['style'], childList:'true'})
        navBarObserver.observe(navFeats, {attributeFilter:['style']})
        navBarObserver.observe(navActions, {attributeFilter:['style']})
        function navBarAction(mutationList) {
            for (const mutation of mutationList) {
                console.log(mutation)
                if (!mutation.target.classList.contains('section-menu-selected')) {
                    continue;
                }
                if (mutation.target.textContent==='Spells') {
                    console.log('Spells selected! Adding observer')
                }
                console.log('Changed to a valid tab! Adding buttons')
            }
        }
*/