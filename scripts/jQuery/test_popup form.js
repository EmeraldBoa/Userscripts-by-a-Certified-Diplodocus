// ==UserScript==
// @name         test_popup form
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        http*://archiveofourown.org/works/*
// @grant        GM_addStyle
// ==/UserScript==

/* eslint-env jquery */

this.$ = this.jQuery = jQuery.noConflict(true); // Prevent conflict with website JQuery libraries (on FFN specifically)

(function() {

    // make a button
    jQuery('ul.work').append('<li class="copy_for_Reddit2" onmouseover="" style="cursor: pointer;"><a><img src="https://www.reddit.com/favicon.ico" height="18"></a></li>');

    $('.copy_for_Reddit2').click(function() {

        var el = document.createElement("div");
        el.setAttribute("style","position:fixed;top:50%;left:45%;background-color:blanchedalmond;font-size:200%;" +
                        "padding-left:20px;padding-right:20px;padding-top:10px;padding-bottom:10px");
        el.innerHTML = "hello world"
        el.id = 'dialog';
        el.style.display = 'none';
        $("body").append(el);
        $("#dialog").dialog({
            autoOpen: false,
            title: "This is a dialog.",
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 500
            }
        });
        $("#dialog").dialog('open');
    })

})();