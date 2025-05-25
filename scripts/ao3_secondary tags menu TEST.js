// ==UserScript==
// @name         🛠 AO3: tag filter MENU TEST
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  test menu for tag filter
// @author       CertifiedDiplodocus (from scriptfairy)
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @icon         https://upload.wikimedia.org/wikipedia/commons/8/8c/Cib-archive-of-our-own_%28CoreUI_Icons_v1.0.0%29.svg
// @license      GPL-3.0-or-later
// @grant        none
// ==/UserScript==

(function () {
    'use strict'

    const menu = createNewElement()

    class elem {
        constructor(elementType, className, textContent) {
            const el = document.createElement(elementType)
            el.className = className
            el.textContent = textContent
            return el
        }
    }
    /** Creates a <div> containing tag input field, number of tags to observe, and a checkbox:
     * <div>
     * 
     */
    const elModel = `
    <div>
        sdaf
    </div>
    `
    class tagBlock {
        constructor(tagType) {
            const wrapperDiv = new elem('div', 'tag-block'),
                selector = new elem(),
                checkbox = new elem(),
                tagTypeLabel = new elem(),
                tagList = new elem('input'),
                withinDiv = new elem('div'),
                withinText1 = new elem('span', '', 'within the first'),
                withinText2 = new elem('span', '', 'tags'),
                tagLimit = new elem('input')
            withinDiv.append(withinText1, tagLimit, withinText2)
            wrapperDiv.append(selector, tagList)
            this.checkbox = selector
            this.tagList = tagList
            this.tagLimit = tagLimit
            return wrapperDiv
        }
    }

    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType)
        className && (el.className = className)
        el.textContent = textContent
        return el
    }

})()
