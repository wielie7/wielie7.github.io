$(document).ready(function() {

    var welcomeTopContainer = document.getElementById('Home');
    
    function fadeOutOnScrollFromTop(element) {

        var welcomeContainer = document.getElementById('welcome-hero-container');
        
        var distanceToTop = window.scrollY + element.getBoundingClientRect().top;
        var elementHeight = element.offsetHeight;
        var scrollTop = document.documentElement.scrollTop;
        
        var opacity = 1;
        
        if (scrollTop > distanceToTop) {
            opacity = 1 - (scrollTop - distanceToTop) / elementHeight;
        }
        
        if (opacity > 0) {
            welcomeContainer.style.opacity = opacity;
            welcomeContainer.style.display = null;
        } else{
            welcomeContainer.style.opacity = 0;
            welcomeContainer.style.display = 'none';
        }

    }
    
    function scrollHandler() {
        
        fadeOutOnScrollFromTop(welcomeTopContainer);
    } 
    
    if (!window.location.href.includes("#")) {
        
        $("html, body").animate({ scrollTop: 0 }, "slow");

        } else{
    scrollHandler()
            }
        window.addEventListener('scroll', scrollHandler);

    function showToast() {
        Toastify({
            text: "Message Sent!",
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
          }).showToast();
    }


    function findGetParams(parameter_name) {
        var result = null;
        var tmp = [];

        window.location.search.substr(1).split("&").forEach(function (item){ 
            tmp = item.split("=");
            if (tmp[0] == parameter_name) result = decodeURIComponent(tmp[1]);
        });
        return result;
    }

    if (findGetParams("callback") == "contact") {
        showToast();
    }

    
});