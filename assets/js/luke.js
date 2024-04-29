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
    
    $("html, body").animate({ scrollTop: 0 }, "slow");
    window.addEventListener('scroll', scrollHandler);
});