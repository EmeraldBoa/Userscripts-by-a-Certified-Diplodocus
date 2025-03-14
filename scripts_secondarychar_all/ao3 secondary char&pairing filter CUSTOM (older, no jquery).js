// ==UserScript==
// @name         ao3 secondary char&pairing filter CUSTOM
// @namespace    https://greasyfork.org/en/users/36620
// @version      0.3.5
// @description  hides works if chosen tags are late in sequence
// @author       scriptfairy
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @grant        none
// ==/UserScript==

/* eslint-env jquery */ //           allows jQuery

/* CONFIG
   keep a plaintext file of your config because they will not be saved when the script updates */

const relationships = [];
// the relationship tags you want to see (exact, case-sensitive)

const characters = ['Yagi Toshinori | All Might', 'Yagi Toshinori', 'Toshinori Yagi', 'All Might', 'Toshinori | All Might',
                    'Aizawa Shouta | Eraserhead', 'Aizawa Shouta', 'Eraserhead', 'Shouta Aizawa',
                    'Musashi | Jessie', 'Kojirou | James', 'Nyarth | Team Rocket Meowth', 'Team Rocket Trio (Pokemon)',
                    'Spy (Team Fortress 2)', 'BLU Spy (Team Fortress 2)', 'RED Spy (Team Fortress 2)'];
// the character tags you want to see (exact, case-sensitive)

const relpad = 3;
// you want to see at least one of your relationships within this many relationship tags

const charpad = 3;
// you want to see at least one of your characters within this many character tags

// The script only runs when the tag you're browsing belongs to a fandom, so yes on tags like "Post-Captain America: The Winter Soldier" but no on tags like "Angst".
// NIMG thoughts: this makes sense, since otherwise the script would activate *whenever* you browse, even outside the fandoms you've defined.
// HOWEVER: some tags are fandom-specific but not character-based, e.g. "https://archiveofourown.org/tags/Canon%20Divergence%20-%20A%20Tale%20of%20Two%20Stans" for Gravity Falls
// and would therefore trigger the script.

/* END CONFIG */

(function($) {
    'use strict';
    let i

    $('<style>').text(
        '.workhide{border:1px solid rgb(221,221,221);margin:0.643em 0em;padding:0.429em 0.75em;height:29px;} ' +
        '.workhide .left{float:left;padding-top:5px;} .workhide .right{float:right}'
    ).appendTo($('head'));

    if (relationships.length === 0 && characters.length === 0) {return;}

    // Is this a valid page? (Are we browsing a tag that has a fandom?)
    let checkfandom = document.createElement('div');
    let fandomlink = $('h2.heading a')[0].href;
    fandomlink = fandomlink.slice(fandomlink.indexOf('tags'));
    $(checkfandom).load('/'+fandomlink+' .parent', function(){

        if ($('ul', checkfandom).text() == "No Fandom") {return;}

        // this needs to be within .load(), or it will run out of order

        for (i=0; i<$('.index .blurb').length; i++){ // iterate through works (.work.blurb?)

            let tags = $('.index .blurb ul.tags')[i],
                reltags = $('.relationships', tags).slice(0,relpad),
                chartags = $('.characters', tags).slice(0,charpad),
                temprel = [],
                tempchar = [];

            $(reltags).map(function() {
                temprel.push(this.innerText);
            });
            $(chartags).map(function() {
                tempchar.push(this.innerText);
            });
            let relmatch = temprel.filter(function(n) {
                return relationships.indexOf(n) != -1;
            });
            let charmatch = tempchar.filter(function(n) {
                return characters.indexOf(n) != -1;
            });
            if (relmatch.length === 0 && charmatch.length === 0) {
                let work = $('.index .blurb')[i];
                work.style.display = 'none';
                let button = document.createElement('div');
                button.setAttribute('class','workhide');
                button.innerHTML = '<div class="left">This work does not prioritize your preferred tags.</div><div class="right"><button type="button" class="showwork">Show Work</button></div>';
                $(work).after(button);
            }
        }
        $(document).ready(function(){
            $('.showwork').click(function() {
                let blurb = $(this).parents('.workhide').prev()[0];
                $(blurb).removeAttr('style');
                $(this).parents('.workhide').remove();
            });
        });
    });


})(window.jQuery);