(() => {
    const images = document.querySelectorAll('.product-hero img, .product-gallery img');
    if (!images.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Product image inspection view');
    lightbox.innerHTML = `
        <div class="image-lightbox__controls" aria-label="Image zoom controls">
            <button type="button" data-zoom-out aria-label="Zoom out">&minus;</button>
            <span class="image-lightbox__level" aria-live="polite">100%</span>
            <button type="button" data-zoom-in aria-label="Zoom in">+</button>
            <button type="button" data-zoom-reset>Reset</button>
            <button type="button" data-zoom-close aria-label="Close enlarged photograph">&times;</button>
        </div>
        <div class="image-lightbox__stage"><img alt="" draggable="false"></div>
        <p class="image-lightbox__hint">Scroll to zoom &middot; Drag to inspect</p>`;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.image-lightbox__stage img');
    const closeButton = lightbox.querySelector('[data-zoom-close]');
    const zoomLevel = lightbox.querySelector('.image-lightbox__level');
    let trigger = null;
    let scale = 1;
    let x = 0;
    let y = 0;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    function renderZoom() {
        lightboxImage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        lightboxImage.classList.toggle('is-zoomed', scale > 1);
        zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    }

    function setZoom(nextScale) {
        scale = Math.min(4, Math.max(1, nextScale));
        if (scale === 1) x = y = 0;
        renderZoom();
    }

    function openLightbox(image) {
        trigger = image;
        lightboxImage.src = image.dataset.fullSrc || image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        document.body.classList.remove('lightbox-open');
        scale = 1;
        x = y = 0;
        renderZoom();
        if (trigger) trigger.focus();
    }

    images.forEach((image) => {
        image.classList.add('inspectable-image');
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-label', `Enlarge image: ${image.alt}`);
        image.addEventListener('click', () => openLightbox(image));
        image.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(image);
            }
        });
    });

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    closeButton.addEventListener('click', closeLightbox);
    lightbox.querySelector('[data-zoom-in]').addEventListener('click', () => setZoom(scale + .5));
    lightbox.querySelector('[data-zoom-out]').addEventListener('click', () => setZoom(scale - .5));
    lightbox.querySelector('[data-zoom-reset]').addEventListener('click', () => setZoom(1));
    lightboxImage.addEventListener('click', () => {
        if (!moved) setZoom(scale === 1 ? 2 : 1);
    });
    lightboxImage.addEventListener('wheel', (event) => {
        event.preventDefault();
        setZoom(scale + (event.deltaY < 0 ? .25 : -.25));
    }, { passive: false });
    lightboxImage.addEventListener('pointerdown', (event) => {
        moved = false;
        if (scale === 1) return;
        dragging = true;
        startX = event.clientX - x;
        startY = event.clientY - y;
        lightboxImage.setPointerCapture(event.pointerId);
    });
    lightboxImage.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const nextX = event.clientX - startX;
        const nextY = event.clientY - startY;
        if (Math.abs(nextX - x) > 2 || Math.abs(nextY - y) > 2) moved = true;
        x = nextX;
        y = nextY;
        renderZoom();
    });
    lightboxImage.addEventListener('pointerup', () => { dragging = false; });
    lightboxImage.addEventListener('pointercancel', () => { dragging = false; });
    document.addEventListener('keydown', (event) => {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === '+') setZoom(scale + .5);
        if (event.key === '-') setZoom(scale - .5);
    });
})();
