// ==UserScript==
// @name         Tumblr prev/next shortcut
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0
// @description  keyboard shortcuts to browse forward/back on custom tumblr pages
// @author       CertifiedDiplodocus
// @match        https://*.tumblr.com/*
// @match        https://*.tumblr.com/tagged/*
// @match        https://*.tumblr.com/search/*
// @exclude      https://*.tumblr.com/post/*
// @icon         https://www.tumblr.com/favicon.ico
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==

// apparently this loads multiple times per page - perhaps for mentioned blogs? (fewer instances on pages with few posts)

(function () {
    const currentURL = window.location.href
    let thisPage, rootURL

    /** page patterns:
     * https://blogname.tumblr.com/page/#
     * https://blogname.tumblr.com/search/.../page/#
     * https://blogname.tumblr.com/tagged/.../page/#
     */

    const splitURLonPage = currentURL.split('/page/')
    rootURL = splitURLonPage[0] + '/page/'
    thisPage = splitURLonPage[1] || 1

    const pageHasPosts = (document.querySelector('article')) // this won't work
    const isFirstPage = (thisPage === 1)

    const prevURL = rootURL + (thisPage - 1)
    const nextURL = rootURL + (thisPage + 1)

    const isKeyPressed = {
        ArrowLeft: false,
        ArrowRight: false,
    }

    document.onkeydown = (keyDownEvent) => {
        isKeyPressed[keyDownEvent.key] = true
        if (!KeyboardEvent.metaKey && KeyboardEvent.ctrlKey) {
            if (KeyboardEvent[isKeyPressed.ArrowLeft]) { window.location.href = prevURL }
            if (KeyboardEvent[isKeyPressed.ArrowRight]) { window.location.href = nextURL }
        }
    }
    document.onkeyup = (keyUpEvent) => { isKeyPressed[keyDownEvent.key] = false }
})
