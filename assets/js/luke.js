$(function () {
    "use strict";

    var homeSection = document.getElementById("Home");
    var welcomeContainer = document.getElementById("welcome-hero-container");

    // Fade the hero as it leaves the viewport. Product pages do not contain
    // these elements, so attach the listener only on the home page.
    if (homeSection && welcomeContainer) {
        var homeTop = window.scrollY + homeSection.getBoundingClientRect().top;
        var homeHeight = homeSection.offsetHeight;

        function updateHeroVisibility() {
            var opacity = 1;

            if (window.scrollY > homeTop) {
                opacity = 1 - (window.scrollY - homeTop) / homeHeight;
            }

            opacity = Math.max(0, Math.min(1, opacity));
            welcomeContainer.style.opacity = opacity;
            welcomeContainer.style.display = opacity === 0 ? "none" : "";
        }

        if (!window.location.hash) {
            $("html, body").animate({ scrollTop: 0 }, "slow");
        } else {
            updateHeroVisibility();
        }

        window.addEventListener("scroll", updateHeroVisibility);
    }

    // FormSubmit redirects back with this callback after a successful message.
    var callback = new URLSearchParams(window.location.search).get("callback");

    if (callback === "contact" && typeof Toastify === "function") {
        Toastify({
            text: "Message Sent!",
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)"
            }
        }).showToast();
    }
});
