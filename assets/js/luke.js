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
        
        if (opacity >= 0) {
            welcomeContainer.style.opacity = opacity;
        }
    }
    
    function scrollHandler() {
        fadeOutOnScrollFromTop(welcomeTopContainer);
    }
    
    window.addEventListener('scroll', scrollHandler);
});