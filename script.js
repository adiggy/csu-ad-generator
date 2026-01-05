/**
 * CSU Social Media Asset Generator
 * Main Application Logic
 */

(function() {
    'use strict';

    // ===========================================
    // DOM Element References
    // ===========================================
    const elements = {
        // Inputs
        platformSelect: document.getElementById('platform-select'),
        templateSelect: document.getElementById('template-select'),
        effectSelect: document.getElementById('effect-select'),
        headlineInput: document.getElementById('headline-input'),
        subheadlineInput: document.getElementById('subheadline-input'),
        ctaInput: document.getElementById('cta-input'),
        eventDate: document.getElementById('event-date'),
        eventTime: document.getElementById('event-time'),
        imageInput: document.getElementById('image-input'),
        uploadLabel: document.getElementById('upload-label'),
        fileName: document.getElementById('file-name'),

        // Character counters
        headlineCount: document.getElementById('headline-count'),
        subheadlineCount: document.getElementById('subheadline-count'),

        // Template elements - Gradient style
        template: document.getElementById('template'),
        templateBackground: document.getElementById('template-background'),
        backgroundImg: document.getElementById('background-img'),
        templateHeadline: document.getElementById('template-headline'),
        templateSubheadline: document.getElementById('template-subheadline'),
        templateCta: document.getElementById('template-cta'),
        templateDate: document.getElementById('template-date'),
        templateLogo: document.getElementById('template-logo'),

        // Template elements - Bars style (panel)
        panelHeadline: document.getElementById('panel-headline'),
        panelSubheadline: document.getElementById('panel-subheadline'),
        panelCta: document.getElementById('panel-cta'),
        panelDate: document.getElementById('panel-date'),
        panelLogo: document.getElementById('panel-logo'),

        // Preview
        previewScaled: document.getElementById('preview-scaled'),

        // Download
        downloadBtn: document.getElementById('download-btn'),

        // Photo adjustment
        photoAdjustGroup: document.getElementById('photo-adjust-group'),
        photoZoom: document.getElementById('photo-zoom'),
        zoomValue: document.getElementById('zoom-value'),
        imageWarning: document.getElementById('image-warning'),
        minDimensions: document.getElementById('min-dimensions'),

        // Date/time toggle
        showDateToggle: document.getElementById('show-date-toggle'),
        dateTimeFields: document.getElementById('date-time-fields')
    };

    // ===========================================
    // Configuration
    // ===========================================
    const config = {
        platforms: {
            instagram: {
                width: 1080,
                height: 1080,
                name: 'Instagram Post'
            },
            twitter: {
                width: 1600,
                height: 900,
                name: 'Twitter Card'
            }
        },
        logos: {
            white: 'brand-guidelines/logos/IncExc-VPIE-CSU-HWht.png',
            color: 'brand-guidelines/logos/IncExc-VPIE-CSU-H357.png'
        },
        charLimits: {
            headline: 60,
            subheadline: 120
        }
    };

    // Store the base64 logos for export
    let logoWhiteBase64 = null;
    let logoColorBase64 = null;
    let photocopyTextureBase64 = null;

    // Photo adjustment state
    let photoState = {
        zoom: 100,
        posX: 50,  // object-position X percentage (50 = center)
        posY: 50,  // object-position Y percentage (50 = center)
        isDragging: false,
        startX: 0,
        startY: 0,
        startPosX: 50,
        startPosY: 50
    };

    // ===========================================
    // Initialization
    // ===========================================
    function init() {
        setupEventListeners();
        updatePreviewScale();
        preloadLogos();
        updateCharCounters();
        loadDefaultPhoto();
        setDefaultDate();

        // Handle window resize
        window.addEventListener('resize', debounce(updatePreviewScale, 150));
    }

    // ===========================================
    // Set Default Date
    // ===========================================
    function setDefaultDate() {
        // Set a default date (next week from today)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const dateStr = nextWeek.toISOString().split('T')[0];
        elements.eventDate.value = dateStr;
        elements.eventTime.value = '14:00';
        updateDateTime();
    }

    // ===========================================
    // Load Default Photo
    // ===========================================
    function loadDefaultPhoto() {
        const defaultPhotoPath = 'assets/puppy.jpg';

        // Show photo adjustment controls
        elements.photoAdjustGroup.style.display = 'block';
        elements.fileName.textContent = 'puppy.jpg';
        elements.uploadLabel.classList.add('has-file');

        // Reset photo state
        photoState.zoom = 100;
        photoState.posX = 50;
        photoState.posY = 50;
        elements.photoZoom.value = 100;
        elements.zoomValue.textContent = '100%';

        // Load the default image
        elements.backgroundImg.src = defaultPhotoPath;
        elements.backgroundImg.onload = function() {
            updatePhotoTransform();
            checkImageQuality();
        };
    }

    // ===========================================
    // Event Listeners Setup
    // ===========================================
    function setupEventListeners() {
        // Text inputs - real-time updates
        elements.headlineInput.addEventListener('input', updateHeadline);
        elements.subheadlineInput.addEventListener('input', updateSubheadline);
        elements.ctaInput.addEventListener('input', updateCta);

        // Date/time inputs
        elements.eventDate.addEventListener('change', updateDateTime);
        elements.eventTime.addEventListener('change', updateDateTime);

        // Date/time toggle
        elements.showDateToggle.addEventListener('change', handleDateToggle);

        // Platform selection
        elements.platformSelect.addEventListener('change', handlePlatformChange);

        // Template style selection
        elements.templateSelect.addEventListener('change', handleTemplateChange);

        // Photo effect selection
        elements.effectSelect.addEventListener('change', handleEffectChange);

        // Image upload
        elements.imageInput.addEventListener('change', handleImageUpload);

        // Drag and drop support
        elements.uploadLabel.addEventListener('dragover', handleDragOver);
        elements.uploadLabel.addEventListener('dragleave', handleDragLeave);
        elements.uploadLabel.addEventListener('drop', handleDrop);

        // Download button
        elements.downloadBtn.addEventListener('click', handleDownload);

        // Photo zoom slider
        elements.photoZoom.addEventListener('input', handleZoomChange);

        // Photo drag to pan
        elements.backgroundImg.addEventListener('mousedown', handlePhotoDragStart);
        document.addEventListener('mousemove', handlePhotoDrag);
        document.addEventListener('mouseup', handlePhotoDragEnd);

        // Touch support for mobile
        elements.backgroundImg.addEventListener('touchstart', handlePhotoDragStart, { passive: false });
        document.addEventListener('touchmove', handlePhotoDrag, { passive: false });
        document.addEventListener('touchend', handlePhotoDragEnd);
    }

    // ===========================================
    // Character Counter Functions
    // ===========================================
    function updateCharCounters() {
        updateHeadlineCounter();
        updateSubheadlineCounter();
    }

    function updateHeadlineCounter() {
        const count = elements.headlineInput.value.length;
        const limit = config.charLimits.headline;
        elements.headlineCount.textContent = count;

        const counter = elements.headlineCount.parentElement;
        counter.classList.remove('warning', 'limit');
        if (count >= limit) {
            counter.classList.add('limit');
        } else if (count >= limit * 0.8) {
            counter.classList.add('warning');
        }
    }

    function updateSubheadlineCounter() {
        const count = elements.subheadlineInput.value.length;
        const limit = config.charLimits.subheadline;
        elements.subheadlineCount.textContent = count;

        const counter = elements.subheadlineCount.parentElement;
        counter.classList.remove('warning', 'limit');
        if (count >= limit) {
            counter.classList.add('limit');
        } else if (count >= limit * 0.8) {
            counter.classList.add('warning');
        }
    }

    // ===========================================
    // Text Update Functions
    // ===========================================
    function updateHeadline() {
        const text = elements.headlineInput.value.trim() || 'Your Headline Here';
        elements.templateHeadline.textContent = text;
        elements.panelHeadline.textContent = text;
        updateHeadlineCounter();
    }

    function updateSubheadline() {
        const text = elements.subheadlineInput.value.trim() || 'Your sub-headline text goes here.';
        elements.templateSubheadline.textContent = text;
        elements.panelSubheadline.textContent = text;
        updateSubheadlineCounter();
    }

    function updateCta() {
        const text = elements.ctaInput.value.trim() || 'colostate.edu/inclusive';
        elements.templateCta.textContent = text;
        elements.panelCta.textContent = text;
    }

    // ===========================================
    // Date/Time Update Function
    // ===========================================
    function updateDateTime() {
        const dateValue = elements.eventDate.value;
        const timeValue = elements.eventTime.value;

        let displayText = '';

        if (dateValue) {
            const date = new Date(dateValue + 'T00:00:00');
            const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
            displayText = date.toLocaleDateString('en-US', options);
        }

        if (timeValue) {
            const [hours, minutes] = timeValue.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            displayText += displayText ? ` • ${timeStr}` : timeStr;
        }

        elements.templateDate.textContent = displayText;
        elements.panelDate.textContent = displayText;
    }

    // ===========================================
    // Date/Time Toggle Handler
    // ===========================================
    function handleDateToggle() {
        const isVisible = elements.showDateToggle.checked;

        if (isVisible) {
            elements.dateTimeFields.classList.remove('hidden');
            updateDateTime(); // Restore the date display
        } else {
            elements.dateTimeFields.classList.add('hidden');
            // Clear the date display in the template
            elements.templateDate.textContent = '';
            elements.panelDate.textContent = '';
        }
    }

    // ===========================================
    // Template Style Change Handler
    // ===========================================
    function handleTemplateChange() {
        const style = elements.templateSelect.value;

        // Remove existing template style classes
        elements.template.classList.remove('template-gradient', 'template-bars');

        // Add new template style class
        if (style === 'gradient') {
            elements.template.classList.add('template-gradient');
        } else if (style === 'bars') {
            elements.template.classList.add('template-bars');
        }

        // Recalculate photo dimensions for new container size
        setTimeout(() => {
            updatePhotoTransform();
            checkImageQuality();
        }, 0);
    }

    // ===========================================
    // Photo Effect Change Handler
    // ===========================================
    function handleEffectChange() {
        const effect = elements.effectSelect.value;

        // Remove all effect classes
        elements.template.classList.remove('effect-none', 'effect-photocopy', 'effect-duotone', 'effect-halftone');

        // Add selected effect class
        if (effect !== 'none') {
            elements.template.classList.add('effect-' + effect);
        }
    }

    // ===========================================
    // Platform Change Handler
    // ===========================================
    function handlePlatformChange() {
        const platform = elements.platformSelect.value;

        // Remove existing platform classes
        elements.template.classList.remove('instagram', 'twitter');

        // Add new platform class
        elements.template.classList.add(platform);

        // Update preview scaling
        updatePreviewScale();

        // Recalculate photo dimensions for new container size
        setTimeout(() => {
            updatePhotoTransform();
            checkImageQuality();
        }, 0);
    }

    // ===========================================
    // Preview Scaling
    // ===========================================
    function updatePreviewScale() {
        const platform = elements.platformSelect.value;
        const platformConfig = config.platforms[platform];

        // Get available dimensions (preview panel size minus padding and button space)
        const previewPanel = document.querySelector('.preview-panel');
        const availableWidth = previewPanel.clientWidth - 64;
        const availableHeight = previewPanel.clientHeight - 80; // Space for label + button

        // Calculate scale factor to fit within available space
        const scaleX = availableWidth / platformConfig.width;
        const scaleY = availableHeight / platformConfig.height;
        const scale = Math.min(scaleX, scaleY);

        // Apply scaling
        elements.previewScaled.style.transform = `scale(${scale})`;
        elements.previewScaled.style.width = `${platformConfig.width}px`;
        elements.previewScaled.style.height = `${platformConfig.height}px`;

        // Set container dimensions to scaled size to prevent overflow
        const previewContainer = document.querySelector('.preview-container');
        previewContainer.style.width = `${platformConfig.width * scale}px`;
        previewContainer.style.height = `${platformConfig.height * scale}px`;
    }

    // ===========================================
    // Image Upload Handlers
    // ===========================================
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            processImageFile(file);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        elements.uploadLabel.classList.add('has-file');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!elements.imageInput.files.length) {
            elements.uploadLabel.classList.remove('has-file');
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.match(/^image\/(jpeg|png|jpg)$/)) {
                elements.imageInput.files = files;
                processImageFile(file);
            } else {
                alert('Please upload a JPG or PNG image.');
                elements.uploadLabel.classList.remove('has-file');
            }
        }
    }

    function processImageFile(file) {
        // Show file name
        elements.fileName.textContent = file.name;
        elements.uploadLabel.classList.add('has-file');

        // Show photo adjustment controls
        elements.photoAdjustGroup.style.display = 'block';

        // Reset photo state
        photoState.zoom = 100;
        photoState.posX = 50;
        photoState.posY = 50;
        elements.photoZoom.value = 100;
        elements.zoomValue.textContent = '100%';

        // Convert to Base64 and set as img src for better html2canvas compatibility
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            elements.backgroundImg.src = base64;
            elements.backgroundImg.onload = function() {
                updatePhotoTransform();
                checkImageQuality();
            };
        };
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    // ===========================================
    // Photo Adjustment Handlers
    // ===========================================
    function handleZoomChange() {
        photoState.zoom = parseInt(elements.photoZoom.value);
        elements.zoomValue.textContent = photoState.zoom + '%';
        updatePhotoTransform();
        checkImageQuality();
    }

    function handlePhotoDragStart(e) {
        if (!elements.backgroundImg.src) return;

        e.preventDefault();
        photoState.isDragging = true;
        elements.backgroundImg.classList.add('dragging');

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        photoState.startX = clientX;
        photoState.startY = clientY;
        photoState.startPosX = photoState.posX;
        photoState.startPosY = photoState.posY;
    }

    function handlePhotoDrag(e) {
        if (!photoState.isDragging) return;

        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Calculate movement as percentage
        const deltaX = photoState.startX - clientX;
        const deltaY = photoState.startY - clientY;

        // Sensitivity - how much the position changes per pixel of drag
        const sensitivity = 0.15;

        // Calculate new position
        let newPosX = photoState.startPosX + (deltaX * sensitivity);
        let newPosY = photoState.startPosY + (deltaY * sensitivity);

        // Clamp values between 0 and 100
        newPosX = Math.max(0, Math.min(100, newPosX));
        newPosY = Math.max(0, Math.min(100, newPosY));

        photoState.posX = newPosX;
        photoState.posY = newPosY;

        updatePhotoTransform();
    }

    function handlePhotoDragEnd() {
        photoState.isDragging = false;
        elements.backgroundImg.classList.remove('dragging');
    }

    function updatePhotoTransform() {
        const img = elements.backgroundImg;
        if (!img.naturalWidth || !img.naturalHeight) return;

        // Get container dimensions
        const container = elements.templateBackground;
        const containerW = container.offsetWidth;
        const containerH = container.offsetHeight;

        if (!containerW || !containerH) return;

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;

        // Calculate scale to "cover" the container (fills frame, may crop)
        const scaleX = containerW / imgW;
        const scaleY = containerH / imgH;
        const coverScale = Math.max(scaleX, scaleY);

        // User zoom: 100% = cover (fills frame), <100% = zoom out, >100% = zoom in
        const userZoom = photoState.zoom / 100;
        const finalScale = coverScale * userZoom;

        // Calculate displayed image size
        const displayW = Math.round(imgW * finalScale);
        const displayH = Math.round(imgH * finalScale);

        // Calculate excess (how much image exceeds container = pan range)
        // Can be negative if zoomed out below cover scale
        const excessW = displayW - containerW;
        const excessH = displayH - containerH;

        // Calculate position based on posX/posY (0-100)
        // Center if image is smaller than container in that dimension
        let left, top;

        if (excessW > 0) {
            left = -Math.round((photoState.posX / 100) * excessW);
        } else {
            left = Math.round(-excessW / 2);
        }

        if (excessH > 0) {
            top = -Math.round((photoState.posY / 100) * excessH);
        } else {
            top = Math.round(-excessH / 2);
        }

        // Apply styles
        img.style.width = displayW + 'px';
        img.style.height = displayH + 'px';
        img.style.left = left + 'px';
        img.style.top = top + 'px';
        img.style.transform = 'none';
    }

    // ===========================================
    // Image Quality Check
    // ===========================================
    function checkImageQuality() {
        const img = elements.backgroundImg;
        if (!img.naturalWidth || !img.naturalHeight) return;

        const platform = elements.platformSelect.value;
        const template = elements.templateSelect.value;
        const zoom = photoState.zoom / 100;

        // Get the output dimensions for the photo area
        const platformConfig = config.platforms[platform];
        let requiredWidth = platformConfig.width;
        let requiredHeight = platformConfig.height;

        // For Energy Bars template, photo only covers 50% width
        if (template === 'bars') {
            requiredWidth = Math.ceil(platformConfig.width * 0.5);
        }

        // Account for zoom - higher zoom means we need more pixels
        requiredWidth = Math.ceil(requiredWidth * zoom);
        requiredHeight = Math.ceil(requiredHeight * zoom);

        // Check if image is large enough
        // With object-fit: cover, the image scales to cover the container
        // So we need to check based on aspect ratios
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = requiredWidth / requiredHeight;

        let effectiveWidth, effectiveHeight;
        if (imgAspect > containerAspect) {
            // Image is wider - height is the limiting factor
            effectiveHeight = img.naturalHeight;
            effectiveWidth = effectiveHeight * containerAspect;
        } else {
            // Image is taller - width is the limiting factor
            effectiveWidth = img.naturalWidth;
            effectiveHeight = effectiveWidth / containerAspect;
        }

        // Check if the effective dimensions meet requirements
        const isQualityOk = effectiveWidth >= requiredWidth && effectiveHeight >= requiredHeight;

        if (!isQualityOk) {
            // Calculate minimum recommended dimensions
            let minWidth, minHeight;
            if (imgAspect > containerAspect) {
                // Need more height
                minHeight = requiredHeight;
                minWidth = Math.ceil(minHeight * imgAspect);
            } else {
                // Need more width
                minWidth = requiredWidth;
                minHeight = Math.ceil(minWidth / imgAspect);
            }

            elements.minDimensions.textContent = `${minWidth} × ${minHeight}px`;
            elements.imageWarning.style.display = 'flex';
        } else {
            elements.imageWarning.style.display = 'none';
        }
    }

    // ===========================================
    // Asset Preloading (Convert to Base64 for export)
    // ===========================================
    function preloadLogos() {
        // Preload white logo
        const imgWhite = new Image();
        imgWhite.crossOrigin = 'anonymous';
        imgWhite.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = imgWhite.width;
            canvas.height = imgWhite.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgWhite, 0, 0);
            logoWhiteBase64 = canvas.toDataURL('image/png');
            elements.templateLogo.src = logoWhiteBase64;
        };
        imgWhite.src = config.logos.white;

        // Preload color logo
        const imgColor = new Image();
        imgColor.crossOrigin = 'anonymous';
        imgColor.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = imgColor.width;
            canvas.height = imgColor.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgColor, 0, 0);
            logoColorBase64 = canvas.toDataURL('image/png');
            elements.panelLogo.src = logoColorBase64;
        };
        imgColor.src = config.logos.color;

        // Preload photocopy texture
        const imgTexture = new Image();
        imgTexture.crossOrigin = 'anonymous';
        imgTexture.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = imgTexture.width;
            canvas.height = imgTexture.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgTexture, 0, 0);
            photocopyTextureBase64 = canvas.toDataURL('image/jpeg');
        };
        imgTexture.src = 'brand-guidelines/textures/CSU_FindYourEnergy_PhotocopyTexture_RGB.jpg';
    }

    // ===========================================
    // Apply Photocopy Effect (for export)
    // ===========================================
    async function applyPhotocopyEffect(sourceCanvas, templateStyle, platformConfig) {
        return new Promise((resolve) => {
            const textureImg = new Image();
            textureImg.onload = function() {
                // Create a new canvas for the result
                const resultCanvas = document.createElement('canvas');
                resultCanvas.width = sourceCanvas.width;
                resultCanvas.height = sourceCanvas.height;
                const ctx = resultCanvas.getContext('2d');

                // Draw the original rendered content
                ctx.drawImage(sourceCanvas, 0, 0);

                // Calculate the photo area dimensions based on template
                let photoAreaWidth = platformConfig.width;
                let photoAreaHeight = platformConfig.height;
                let photoAreaX = 0;

                if (templateStyle === 'bars') {
                    // Energy bars: photo is left 50%
                    photoAreaWidth = Math.floor(platformConfig.width * 0.5);
                }

                // Create a temporary canvas for the texture
                const textureCanvas = document.createElement('canvas');
                textureCanvas.width = photoAreaWidth;
                textureCanvas.height = photoAreaHeight;
                const textureCtx = textureCanvas.getContext('2d');

                // Draw texture scaled to cover the photo area
                const scale = Math.max(photoAreaWidth / textureImg.width, photoAreaHeight / textureImg.height);
                const scaledWidth = textureImg.width * scale;
                const scaledHeight = textureImg.height * scale;
                const offsetX = (photoAreaWidth - scaledWidth) / 2;
                const offsetY = (photoAreaHeight - scaledHeight) / 2;
                textureCtx.drawImage(textureImg, offsetX, offsetY, scaledWidth, scaledHeight);

                // Apply the texture with overlay blend mode
                ctx.save();
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.7;

                // Only apply to the photo area
                ctx.beginPath();
                ctx.rect(photoAreaX, 0, photoAreaWidth, photoAreaHeight);
                ctx.clip();

                ctx.drawImage(textureCanvas, photoAreaX, 0);
                ctx.restore();

                resolve(resultCanvas);
            };
            textureImg.src = photocopyTextureBase64;
        });
    }

    // ===========================================
    // Download Handler
    // ===========================================
    async function handleDownload() {
        const btn = elements.downloadBtn;
        const originalText = btn.innerHTML;

        try {
            // Disable button and show loading state
            btn.disabled = true;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Generating...
            `;

            // Get current platform and template for filename
            const platform = elements.platformSelect.value;
            const templateStyle = elements.templateSelect.value;
            const effect = elements.effectSelect.value;
            const platformConfig = config.platforms[platform];

            // Reset scale temporarily for accurate export
            const originalTransform = elements.previewScaled.style.transform;
            elements.previewScaled.style.transform = 'scale(1)';

            // For photocopy effect, hide the CSS overlay and apply manually via canvas
            const effectOverlay = document.getElementById('photo-effect-overlay');
            const originalOverlayDisplay = effectOverlay.style.display;
            if (effect === 'photocopy') {
                effectOverlay.style.display = 'none';
            }

            // Use html2canvas to capture the template
            let canvas = await html2canvas(elements.template, {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                width: platformConfig.width,
                height: platformConfig.height,
                logging: false
            });

            // Restore overlay visibility
            if (effect === 'photocopy') {
                effectOverlay.style.display = originalOverlayDisplay;
            }

            // Apply photocopy texture effect manually using canvas
            if (effect === 'photocopy' && photocopyTextureBase64) {
                canvas = await applyPhotocopyEffect(canvas, templateStyle, platformConfig);
            }

            // Restore scale
            elements.previewScaled.style.transform = originalTransform;

            // Create download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `csu-${platform}-${templateStyle}-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            // Show success briefly
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Downloaded!
            `;

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Export error:', error);
            alert('Error generating image. Please try again.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // ===========================================
    // Utility Functions
    // ===========================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===========================================
    // Add CSS for spinner animation
    // ===========================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // ===========================================
    // Initialize App
    // ===========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
