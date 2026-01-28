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
        photoEffectOverlay: document.getElementById('photo-effect-overlay'),
        templateHeadline: document.getElementById('template-headline'),
        templateSubheadline: document.getElementById('template-subheadline'),
        templateCta: document.getElementById('template-cta'),
        templateDate: document.getElementById('template-date'),
        floatingDate: document.getElementById('floating-date'),
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
        dateTimeFields: document.getElementById('date-time-fields'),
        endTimeRow: document.getElementById('end-time-row'),
        showEndTime: document.getElementById('show-end-time'),
        eventEndTime: document.getElementById('event-end-time'),

        // Link toggle
        showLinkToggle: document.getElementById('show-link-toggle'),
        linkFields: document.getElementById('link-fields'),

        // Download format
        formatSelect: document.getElementById('format-select'),

        // Preview zoom controls
        previewPanel: document.getElementById('preview-panel'),
        previewZoomSlider: document.getElementById('preview-zoom-slider'),
        zoomNotch: document.getElementById('zoom-notch')
    };

    // Preview zoom state
    let previewZoom = {
        fitScale: 1,      // Scale that fits the preview area (e.g., 0.5 = 50%)
        currentScale: 1   // Current display scale
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
    let energyBarsBase64 = null;

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
        elements.previewZoomSlider.value = 100; // Start at fit
        updatePreviewScale();
        preloadLogos();
        updateCharCounters();
        updateHeadline();
        updateSubheadline();
        updateCta();
        loadDefaultPhoto();
        setDefaultDate();

        // Show end time row since date toggle is checked by default
        elements.endTimeRow.style.display = 'flex';

        // Position floating date after layout settles
        setTimeout(positionFloatingDate, 100);

        // Handle window resize - recalculate scales and floating date
        window.addEventListener('resize', debounce(() => {
            updatePreviewScale();
            positionFloatingDate();
        }, 150));
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
        elements.eventTime.addEventListener('change', () => {
            updateDateTime();
            filterEndTimeOptions();
        });
        elements.eventEndTime.addEventListener('change', updateDateTime);

        // Date/time toggle
        elements.showDateToggle.addEventListener('change', handleDateToggle);

        // End time toggle
        elements.showEndTime.addEventListener('change', handleEndTimeToggle);

        // Link toggle
        elements.showLinkToggle.addEventListener('change', handleLinkToggle);

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

        // Preview zoom controls
        elements.previewZoomSlider.addEventListener('input', handlePreviewZoomSlider);

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
        const text = elements.headlineInput.value.trim() || 'Your Headline';
        elements.templateHeadline.textContent = text;
        elements.panelHeadline.textContent = text;
        updateHeadlineCounter();
        // Reposition floating date after text reflows
        setTimeout(positionFloatingDate, 0);
    }

    function updateSubheadline() {
        const text = elements.subheadlineInput.value.trim() || 'Your sub-headline goes here';
        elements.templateSubheadline.textContent = text;
        elements.panelSubheadline.textContent = text;
        updateSubheadlineCounter();
        // Reposition floating date after text reflows
        setTimeout(positionFloatingDate, 0);
    }

    function updateCta() {
        const text = elements.ctaInput.value.trim() || 'colostate.edu/link';
        elements.templateCta.textContent = text;
        elements.panelCta.textContent = text;
    }

    // ===========================================
    // Date/Time Update Function
    // ===========================================
    function updateDateTime() {
        const dateValue = elements.eventDate.value;
        const timeValue = elements.eventTime.value;
        const endTimeValue = elements.showEndTime.checked ? elements.eventEndTime.value : '';

        let displayText = '';

        if (dateValue) {
            const date = new Date(dateValue + 'T00:00:00');
            const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
            displayText = date.toLocaleDateString('en-US', options);
        }

        if (timeValue) {
            const [hours, minutes] = timeValue.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

            // Check for end time
            if (endTimeValue) {
                const [endHours, endMinutes] = endTimeValue.split(':');
                const endDate = new Date();
                endDate.setHours(parseInt(endHours), parseInt(endMinutes));
                const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                displayText += displayText ? ` • ${timeStr} – ${endTimeStr}` : `${timeStr} – ${endTimeStr}`;
            } else {
                displayText += displayText ? ` • ${timeStr}` : timeStr;
            }
        }

        elements.templateDate.textContent = displayText;
        elements.floatingDate.textContent = displayText;
        elements.panelDate.textContent = displayText;
    }

    // ===========================================
    // Date/Time Toggle Handler
    // ===========================================
    function handleDateToggle() {
        const isVisible = elements.showDateToggle.checked;

        if (isVisible) {
            elements.dateTimeFields.classList.remove('hidden');
            elements.endTimeRow.style.display = 'flex';
            updateDateTime(); // Restore the date display
        } else {
            elements.dateTimeFields.classList.add('hidden');
            elements.endTimeRow.style.display = 'none';
            // Clear the date display in the template
            elements.templateDate.textContent = '';
            elements.floatingDate.textContent = '';
            elements.panelDate.textContent = '';
        }

        // Recalculate photo dimensions after layout change
        setTimeout(() => {
            updatePhotoTransform();
        }, 0);
    }

    // ===========================================
    // End Time Toggle Handler
    // ===========================================
    function handleEndTimeToggle() {
        const showEndTime = elements.showEndTime.checked;

        if (showEndTime) {
            elements.eventEndTime.style.display = 'block';
            filterEndTimeOptions();
        } else {
            elements.eventEndTime.style.display = 'none';
            elements.eventEndTime.value = '';
        }
        updateDateTime();
    }

    // ===========================================
    // Filter End Time Options
    // ===========================================
    function filterEndTimeOptions() {
        const startTimeValue = elements.eventTime.value;
        const endTimeSelect = elements.eventEndTime;
        const options = endTimeSelect.options;

        // Reset all options to visible first
        for (let i = 0; i < options.length; i++) {
            options[i].disabled = false;
            options[i].style.display = '';
        }

        if (!startTimeValue) {
            return;
        }

        // Parse start time to minutes for comparison
        const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;

        // Disable/hide options that are at or before start time
        for (let i = 0; i < options.length; i++) {
            const optionValue = options[i].value;
            if (!optionValue) continue; // Skip the placeholder option

            const [optHours, optMinutes] = optionValue.split(':').map(Number);
            const optTotalMinutes = optHours * 60 + optMinutes;

            if (optTotalMinutes <= startTotalMinutes) {
                options[i].disabled = true;
                options[i].style.display = 'none';
            }
        }

        // If current end time is now invalid, reset it
        if (endTimeSelect.value) {
            const [endHours, endMinutes] = endTimeSelect.value.split(':').map(Number);
            const endTotalMinutes = endHours * 60 + endMinutes;
            if (endTotalMinutes <= startTotalMinutes) {
                endTimeSelect.value = '';
                updateDateTime();
            }
        }
    }

    // ===========================================
    // Link Toggle Handler
    // ===========================================
    function handleLinkToggle() {
        const isVisible = elements.showLinkToggle.checked;

        if (isVisible) {
            elements.linkFields.classList.remove('hidden');
            updateCta(); // Restore the CTA display
        } else {
            elements.linkFields.classList.add('hidden');
            // Clear the CTA display in the template
            elements.templateCta.textContent = '';
            elements.panelCta.textContent = '';
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

        // Recalculate photo dimensions and reposition floating date
        setTimeout(() => {
            updatePhotoTransform();
            checkImageQuality();
            positionFloatingDate();
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

        // Reset to fit when changing platforms
        elements.previewZoomSlider.value = 100;
        updatePreviewScale();

        // Recalculate photo dimensions and reposition floating date
        setTimeout(() => {
            updatePhotoTransform();
            checkImageQuality();
            positionFloatingDate();
        }, 0);
    }

    // ===========================================
    // Preview Scaling
    // ===========================================
    function updatePreviewScale() {
        const platform = elements.platformSelect.value;
        const platformConfig = config.platforms[platform];

        // Get available dimensions (preview panel size minus padding and controls)
        const previewPanel = elements.previewPanel;
        const availableWidth = previewPanel.clientWidth - 64;
        const availableHeight = previewPanel.clientHeight - 120; // Space for header + controls

        // Calculate fit scale factor (scale that makes template fit the preview area)
        const scaleX = availableWidth / platformConfig.width;
        const scaleY = availableHeight / platformConfig.height;
        previewZoom.fitScale = Math.min(scaleX, scaleY);

        // Slider logic:
        // - Slider max (100) = fit scale (fills preview area)
        // - Slider min (10) = 10% of fit scale (much smaller)
        // - The actual scale = (sliderValue / 100) * fitScale

        const sliderValue = parseInt(elements.previewZoomSlider.value);
        const scale = (sliderValue / 100) * previewZoom.fitScale;

        // Position the 100% notch
        // 100% actual = scale of 1.0
        // Slider position for 100% = (1.0 / fitScale) * 100
        const notchSliderPosition = (1.0 / previewZoom.fitScale) * 100;

        if (notchSliderPosition >= 10 && notchSliderPosition <= 100) {
            // Notch is within slider range - position it
            // Slider track goes from 10 to 100, so we need to map to percentage of track width
            const trackPercent = ((notchSliderPosition - 10) / 90) * 100;
            elements.zoomNotch.style.left = trackPercent + '%';
            elements.zoomNotch.style.display = 'block';
        } else {
            // 100% is outside the reachable range - hide the notch
            elements.zoomNotch.style.display = 'none';
        }

        // Apply scaling
        elements.previewScaled.style.transform = `scale(${scale})`;
        elements.previewScaled.style.width = `${platformConfig.width}px`;
        elements.previewScaled.style.height = `${platformConfig.height}px`;

        // Set container dimensions to scaled size
        const previewContainer = document.querySelector('.preview-container');
        previewContainer.style.width = `${platformConfig.width * scale}px`;
        previewContainer.style.height = `${platformConfig.height * scale}px`;
    }

    // ===========================================
    // Preview Zoom Handlers
    // ===========================================
    function handlePreviewZoomSlider() {
        updatePreviewScale();
    }

    // ===========================================
    // Floating Date Position (for gradient template)
    // ===========================================
    function positionFloatingDate() {
        const templateStyle = elements.templateSelect.value;
        if (templateStyle !== 'gradient') return;

        const templateOverlay = document.querySelector('.template-overlay');
        const template = elements.template;

        if (!templateOverlay || !template) return;

        // Get the current scale from the transform
        const transformStyle = elements.previewScaled.style.transform;
        const scaleMatch = transformStyle.match(/scale\(([^)]+)\)/);
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

        // Get the top position of template-overlay relative to template
        // Divide by scale to get the unscaled position
        const templateRect = template.getBoundingClientRect();
        const overlayRect = templateOverlay.getBoundingClientRect();
        const scaledTopPosition = overlayRect.top - templateRect.top;
        const unscaledTopPosition = scaledTopPosition / scale;

        // Position floating date at the boundary
        elements.floatingDate.style.top = unscaledTopPosition + 'px';
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

        // Gradient template: photo fills full area (solid overlay covers bottom)

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

        // Preload energy bars image
        const imgBars = new Image();
        imgBars.crossOrigin = 'anonymous';
        imgBars.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = imgBars.width;
            canvas.height = imgBars.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgBars, 0, 0);
            energyBarsBase64 = canvas.toDataURL('image/jpeg');
            // Update the energy bars element to use base64 for export
            const energyBarsEl = document.getElementById('energy-bars');
            if (energyBarsEl) {
                energyBarsEl.style.backgroundImage = `url(${energyBarsBase64})`;
            }
        };
        imgBars.src = 'brand-guidelines/textures/energy-bars.jpg';
    }

    // ===========================================
    // Get Photo Area Dimensions
    // ===========================================
    function getPhotoAreaDimensions(templateStyle, platformConfig) {
        let photoAreaWidth = platformConfig.width;
        let photoAreaHeight = platformConfig.height;
        let photoAreaX = 0;
        let photoAreaY = 0;

        if (templateStyle === 'bars') {
            const platform = elements.platformSelect.value;
            if (platform === 'instagram') {
                // Instagram bars: photo is top portion (get actual height from DOM)
                const bgElement = elements.templateBackground;
                photoAreaHeight = bgElement.offsetHeight;
            } else {
                // Twitter bars: photo is left 50%
                photoAreaWidth = Math.floor(platformConfig.width * 0.5);
            }
        } else {
            // Gradient template: photo is top portion (get actual height from DOM)
            const bgElement = elements.templateBackground;
            photoAreaHeight = bgElement.offsetHeight;
        }

        return { photoAreaWidth, photoAreaHeight, photoAreaX, photoAreaY };
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

                // Get photo area dimensions
                const { photoAreaWidth, photoAreaHeight, photoAreaX, photoAreaY } =
                    getPhotoAreaDimensions(templateStyle, platformConfig);

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
                ctx.rect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
                ctx.clip();

                ctx.drawImage(textureCanvas, photoAreaX, photoAreaY);
                ctx.restore();

                resolve(resultCanvas);
            };
            textureImg.src = photocopyTextureBase64;
        });
    }

    // ===========================================
    // Apply Duotone Effect (for export)
    // ===========================================
    async function applyDuotoneEffect(sourceCanvas, templateStyle, platformConfig) {
        return new Promise((resolve) => {
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            const ctx = resultCanvas.getContext('2d');

            // Draw the original rendered content
            ctx.drawImage(sourceCanvas, 0, 0);

            // Get photo area dimensions
            const { photoAreaWidth, photoAreaHeight, photoAreaX, photoAreaY } =
                getPhotoAreaDimensions(templateStyle, platformConfig);

            // Get the photo area image data
            const imageData = ctx.getImageData(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
            const data = imageData.data;

            // CSU Green color
            const greenR = 30, greenG = 77, greenB = 43;

            // Apply grayscale and then hard-light blend with green
            for (let i = 0; i < data.length; i += 4) {
                // Convert to grayscale with slight contrast boost
                let gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                gray = Math.min(255, Math.max(0, (gray - 128) * 1.1 + 128)); // contrast

                // Hard-light blend mode with green
                const blendHardLight = (base, blend) => {
                    if (blend < 128) {
                        return (2 * base * blend) / 255;
                    } else {
                        return 255 - (2 * (255 - base) * (255 - blend)) / 255;
                    }
                };

                data[i] = blendHardLight(gray, greenR);
                data[i + 1] = blendHardLight(gray, greenG);
                data[i + 2] = blendHardLight(gray, greenB);
                // Alpha stays the same
            }

            ctx.putImageData(imageData, photoAreaX, photoAreaY);
            resolve(resultCanvas);
        });
    }

    // ===========================================
    // Apply Halftone Effect (for export)
    // ===========================================
    async function applyHalftoneEffect(sourceCanvas, templateStyle, platformConfig) {
        return new Promise((resolve) => {
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            const ctx = resultCanvas.getContext('2d');

            // Draw the original rendered content
            ctx.drawImage(sourceCanvas, 0, 0);

            // Get photo area dimensions
            const { photoAreaWidth, photoAreaHeight, photoAreaX, photoAreaY } =
                getPhotoAreaDimensions(templateStyle, platformConfig);

            // Create halftone dot pattern
            ctx.save();

            // Clip to photo area
            ctx.beginPath();
            ctx.rect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
            ctx.clip();

            // Draw dot pattern with multiply blend
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.6;

            const dotSize = 3;
            const spacing = 6;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

            for (let y = photoAreaY; y < photoAreaY + photoAreaHeight; y += spacing) {
                for (let x = photoAreaX; x < photoAreaX + photoAreaWidth; x += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Second offset layer
            for (let y = photoAreaY + spacing / 2; y < photoAreaY + photoAreaHeight; y += spacing) {
                for (let x = photoAreaX + spacing / 2; x < photoAreaX + photoAreaWidth; x += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
            resolve(resultCanvas);
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

            // For effects that need manual canvas processing, hide CSS effects
            const effectOverlay = document.getElementById('photo-effect-overlay');
            const originalOverlayDisplay = effectOverlay.style.display;
            const backgroundImg = elements.backgroundImg;

            // Temporarily remove effect class to disable CSS filters
            const hadDuotoneClass = elements.template.classList.contains('effect-duotone');
            const hadPhotocopyClass = elements.template.classList.contains('effect-photocopy');
            const hadHalftoneClass = elements.template.classList.contains('effect-halftone');

            if (effect === 'photocopy' || effect === 'duotone' || effect === 'halftone') {
                effectOverlay.style.display = 'none';
                elements.template.classList.remove('effect-duotone', 'effect-photocopy', 'effect-halftone');
            }

            // For gradient template with effects, capture date badge position for later compositing
            const floatingDate = elements.floatingDate;
            let dateBadgeData = null;
            if (templateStyle === 'gradient' && (effect === 'photocopy' || effect === 'duotone' || effect === 'halftone')) {
                // Get the date badge position relative to template
                const templateRect = elements.template.getBoundingClientRect();
                const dateRect = floatingDate.getBoundingClientRect();
                dateBadgeData = {
                    x: dateRect.left - templateRect.left,
                    y: dateRect.top - templateRect.top,
                    width: dateRect.width,
                    height: dateRect.height
                };
                // Hide the date for initial capture
                floatingDate.style.visibility = 'hidden';
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

            // Restore CSS effects
            if (effect === 'photocopy' || effect === 'duotone' || effect === 'halftone') {
                effectOverlay.style.display = originalOverlayDisplay;
            }
            if (hadDuotoneClass) {
                elements.template.classList.add('effect-duotone');
            }
            if (hadPhotocopyClass) {
                elements.template.classList.add('effect-photocopy');
            }
            if (hadHalftoneClass) {
                elements.template.classList.add('effect-halftone');
            }

            // Apply photocopy texture effect manually using canvas
            if (effect === 'photocopy' && photocopyTextureBase64) {
                canvas = await applyPhotocopyEffect(canvas, templateStyle, platformConfig);
            }

            // Apply duotone effect manually using canvas
            if (effect === 'duotone') {
                canvas = await applyDuotoneEffect(canvas, templateStyle, platformConfig);
            }

            // Apply halftone effect manually using canvas
            if (effect === 'halftone') {
                canvas = await applyHalftoneEffect(canvas, templateStyle, platformConfig);
            }

            // Composite date badge on top if we hid it earlier
            if (dateBadgeData && floatingDate.textContent) {
                // Restore visibility for capture
                floatingDate.style.visibility = 'visible';

                // Capture just the date badge
                const dateBadgeCanvas = await html2canvas(floatingDate, {
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false
                });

                // Draw date badge on top of the final canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(dateBadgeCanvas, dateBadgeData.x, dateBadgeData.y);
            } else if (floatingDate) {
                floatingDate.style.visibility = 'visible';
            }

            // Restore scale
            elements.previewScaled.style.transform = originalTransform;

            // Get selected format
            const format = elements.formatSelect.value;
            const timestamp = new Date().toISOString().slice(0, 10);
            const baseFilename = `csu-${platform}-${templateStyle}-${timestamp}`;

            // Create download based on format
            const link = document.createElement('a');

            if (format === 'png') {
                link.download = `${baseFilename}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            } else if (format === 'jpg') {
                link.download = `${baseFilename}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.92);
                link.click();
            } else if (format === 'gif') {
                // GIF uses PNG with .gif extension (browsers don't truly support GIF encoding)
                link.download = `${baseFilename}.gif`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            } else if (format === 'pdf') {
                // Use jsPDF for PDF export
                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/png', 1.0);

                // Calculate PDF dimensions (72 DPI = points)
                const pdfWidth = platformConfig.width * 72 / 96; // Convert px to points
                const pdfHeight = platformConfig.height * 72 / 96;

                const pdf = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                    unit: 'pt',
                    format: [pdfWidth, pdfHeight]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${baseFilename}.pdf`);
            }

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
    // Feedback Form Functionality
    // ===========================================
    function initFeedbackForm() {
        const feedbackBtn = document.getElementById('feedback-btn');
        const feedbackModal = document.getElementById('feedback-modal');
        const feedbackClose = document.getElementById('feedback-close');
        const feedbackForm = document.getElementById('feedback-form');
        const systemInfoDisplay = document.getElementById('system-info-display');
        const feedbackSuccess = document.getElementById('feedback-success');

        if (!feedbackBtn || !feedbackModal) return;

        // Gather system info
        function getSystemInfo() {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            let os = 'Unknown';

            // Detect browser
            if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Edg')) browser = 'Edge';
            else if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Safari')) browser = 'Safari';

            // Detect OS
            if (ua.includes('Windows')) os = 'Windows';
            else if (ua.includes('Mac')) os = 'macOS';
            else if (ua.includes('Linux')) os = 'Linux';
            else if (ua.includes('Android')) os = 'Android';
            else if (ua.includes('iOS')) os = 'iOS';

            return {
                browser: browser,
                os: os,
                screenSize: `${window.screen.width}x${window.screen.height}`,
                windowSize: `${window.innerWidth}x${window.innerHeight}`,
                platform: elements.platformSelect?.value || 'N/A',
                template: elements.templateSelect?.value || 'N/A',
                effect: elements.effectSelect?.value || 'N/A',
                timestamp: new Date().toISOString()
            };
        }

        // Display system info
        function displaySystemInfo() {
            const info = getSystemInfo();
            systemInfoDisplay.innerHTML = `
                Browser: ${info.browser}<br>
                OS: ${info.os}<br>
                Screen: ${info.screenSize}<br>
                Window: ${info.windowSize}<br>
                Current Settings: ${info.platform}, ${info.template}, ${info.effect}
            `;
        }

        // Open modal
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.classList.add('active');
            displaySystemInfo();
            feedbackForm.style.display = 'block';
            feedbackSuccess.style.display = 'none';
        });

        // Close modal
        feedbackClose.addEventListener('click', () => {
            feedbackModal.classList.remove('active');
        });

        // Close on backdrop click
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                feedbackModal.classList.remove('active');
            }
        });

        // Handle form submission
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = feedbackForm.querySelector('.feedback-submit');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const info = getSystemInfo();
            const feedbackData = {
                type: document.getElementById('feedback-type').value,
                message: document.getElementById('feedback-message').value,
                email: document.getElementById('feedback-email').value,
                browser: info.browser,
                os: info.os,
                screenSize: info.screenSize,
                windowSize: info.windowSize,
                currentSettings: `${info.platform}, ${info.template}, ${info.effect}`,
                timestamp: new Date().toISOString()
            };

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(feedbackData)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit feedback');
                }

                // Show success message
                feedbackForm.style.display = 'none';
                feedbackSuccess.style.display = 'block';

                // Reset form
                feedbackForm.reset();

                // Close modal after delay
                setTimeout(() => {
                    feedbackModal.classList.remove('active');
                }, 2000);
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Failed to submit feedback. Please try again.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ===========================================
    // Initialize App
    // ===========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            initFeedbackForm();
        });
    } else {
        init();
        initFeedbackForm();
    }

})();
