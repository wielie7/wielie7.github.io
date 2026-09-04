$(function () {
    "use strict";

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

    var $clientCarousel = $("#client");

    if ($clientCarousel.length && $.fn.owlCarousel) {
        $clientCarousel.owlCarousel({
            items: 7,
            loop: true,
            smartSpeed: 1000,
            autoplay: true,
            dots: false,
            autoplayHoverPause: true,
            responsive: {
                0: { items: 2 },
                415: { items: 2 },
                600: { items: 4 },
                1199: { items: 4 },
                1200: { items: 7 }
            }
        });

        $(".play").on("click", function () {
            $clientCarousel.trigger("play.owl.autoplay", [1000]);
        });

        $(".stop").on("click", function () {
            $clientCarousel.trigger("stop.owl.autoplay");
        });
    }

    // Apply entrance animations once the hero assets have loaded.
    $window.on("load", function () {
        $(".header-text h2, .header-text p")
            .addClass("animated fadeInUp")
            .css("opacity", "0");
        $(".header-text a")
            .addClass("animated fadeInDown")
            .css("opacity", "0");
    });
});
