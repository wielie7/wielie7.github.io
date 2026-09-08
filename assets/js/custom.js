$(function () {
    "use strict";

    // Preserve the original anchor easing without a separate CDN request.
    $.easing.easeInOutExpo = function (x, t, b, c, d) {
        if (t === 0) return b;
        if (t === d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    };

    var $window = $(window);
    var $navbar = $(".navbar-fixed");
    var $scrollToTop = $(".return-to-top");
    var previousScrollPosition = $window.scrollTop();

    // Keep navigation accessible while scrolling up, without obscuring content
    // while the visitor is moving down the page.
    $window.on("scroll.navigation", function () {
        var currentScrollPosition = $window.scrollTop();
        var isNearPageTop = currentScrollPosition <= 10;
        var isScrollingDown = currentScrollPosition > previousScrollPosition;

        $navbar.toggleClass(
            "navbar-hidden",
            isScrollingDown && !isNearPageTop
        );

        previousScrollPosition = currentScrollPosition;
    });

    // Show the shortcut only after the visitor has moved well down the page.
    $window.on("scroll.returnToTop", function () {
        if ($window.scrollTop() > 600) {
            $scrollToTop.fadeIn();
        } else {
            $scrollToTop.fadeOut();
        }
    });

    $scrollToTop.on("click", function (event) {
        event.preventDefault();

        // Stop an in-progress smooth scroll before starting the return trip.
        $("html, body").stop(true).animate({ scrollTop: 0 }, 300);
    });

    // Initialise optional plugins only when their scripts and elements exist.
    if ($.fn.sticky) {
        $(".header-area").sticky({ topSpacing: 0 });
    }

    $("li.smooth-menu a").on("click", function (event) {
        var $target = $($(this).attr("href"));

        if (!$target.length) {
            return;
        }

        event.preventDefault();
        $("html, body").stop().animate(
            { scrollTop: $target.offset().top },
            1200,
            "easeInOutExpo"
        );
    });

    if ($.fn.scrollspy) {
        $("body").scrollspy({
            target: ".navbar-collapse",
            offset: 0
        });
    }

    // Start the entrance animation when the DOM is ready, without waiting for
    // lower-page photographs to finish downloading.
    $(".header-text h2, .header-text p").addClass("animated fadeInUp");
    $(".header-text a").addClass("animated fadeInDown");
});