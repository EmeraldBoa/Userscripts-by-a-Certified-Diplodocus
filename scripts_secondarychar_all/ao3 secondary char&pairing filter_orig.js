// ==UserScript==
// @name         ao3 secondary char&pairing filter
// @namespace    https://greasyfork.org/en/users/36620
// @version      0.3.5
// @description  hides works if chosen tags are late in sequence
// @author       scriptfairy
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /^http.*://archiveofourown\.org/works/[0-9].*/
// @grant        none
// ==/UserScript==

/* CONFIG
   keep a plaintext file of your config because they will not be saved when the script updates */

var relationships = [];
// the relationship tags you want to see (exact, case-sensitive)

var characters = ['Yagi Toshinori | All Might', 'Yagi Toshinori', 'Toshinori Yagi', 'All Might', 'Toshinori | All Might',
                  'Aizawa Shouta | Eraserhead', 'Aizawa Shouta', 'Eraserhead', 'Shouta Aizawa',
                 'Musashi | Jessie', 'Kojirou | James', 'Nyarth | Team Rocket Meowth', 'Team Rocket Trio (Pokemon)',
                 'Spy (Team Fortress 2)', 'BLU Spy (Team Fortress 2)', 'RED Spy (Team Fortress 2)'];
// the character tags you want to see (exact, case-sensitive)

var relpad = 3;
// you want to see at least one of your relationships within this many relationship tags

var charpad = 3;
// you want to see at least one of your characters within this many character tags

/* END CONFIG */

(function($) {
    'use strict';
    let i

    $('<style>').text(
        '.workhide{border:1px solid rgb(221,221,221);margin:0.643em 0em;padding:0.429em 0.75em;height:29px;} .workhide .left{float:left;padding-top:5px;} .workhide .right{float:right}'
    ).appendTo($('head'));
    if (relationships.length === 0 && characters.length === 0) {return;}
    var checkfandom = document.createElement('div');
    var fandomlink = $('h2.heading a')[0].href;
    fandomlink = fandomlink.slice(fandomlink.indexOf('tags'));
    $(checkfandom).load('/'+fandomlink+' .parent', function(){
        if ($('ul', checkfandom).text() == "No Fandom") {return;}
        else {
            for(i=0;i<$('.index .blurb').length;i++){
                var tags = $('.index .blurb ul.tags')[i];
                var reltags = $('.relationships', tags).slice(0,relpad); var chartags = $('.characters', tags).slice(0,charpad);
                var temprel = []; var tempchar = [];
                $(reltags).map(function() {
                    temprel.push(this.innerText);
                });
                $(chartags).map(function() {
                    tempchar.push(this.innerText);
                });
                var relmatch = temprel.filter(function(n) {
                    return relationships.indexOf(n) != -1;
                });
                var charmatch = tempchar.filter(function(n) {
                    return characters.indexOf(n) != -1;
                });
                if (relmatch.length === 0 && charmatch.length === 0) {
                    var work = $('.index .blurb')[i];
                    work.style.display = 'none';
                    var button = document.createElement('div');
                    button.setAttribute('class','workhide');
                    button.innerHTML = '<div class="left">This work does not prioritize your preferred tags.</div><div class="right"><button type="button" class="showwork">Show Work</button></div>';
                    $(work).after(button);
                }
            }
            $(document).ready(function(){
                $('.showwork').click(function() {
                    var blurb = $(this).parents('.workhide').prev()[0];
                    $(blurb).removeAttr('style');
                    $(this).parents('.workhide').remove();
                });
            });
        }
    });


})(window.jQuery);