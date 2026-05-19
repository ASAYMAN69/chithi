/**
        * Iframe element highlight injection script
        * This script must be included in the target website to support cross-domain iframe highlighting.
        *
        * Usage:
        * 1. Add this script to the target website's HTML
        * 2. Or inject via browser extension or user script
        */

(function () {
    "use strict";

    // Check if in iframe
    if (window.self === window.top) {
        return; // Not in iframe, do not execute
    }

    // Check if already initialized
    if (window.__iframeHighlightInitialized) {
        return;
    }
    window.__iframeHighlightInitialized = true;
    console.log("Iframe highlight script loaded");

    // Create highlight overlay
    var overlay = document.createElement("div");
    overlay.id = "iframe-highlight-overlay";
    overlay.style.cssText = "\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100vw;\n    height: 100vh;\n    pointer-events: none;\n    z-index: 999999;\n    overflow: hidden;\n  ";

    // Create hover highlight box (dashed border)
    var highlightBox = document.createElement("div");
    highlightBox.id = "iframe-highlight-box";
    highlightBox.style.cssText = "\n    position: absolute;\n    border: 2px dashed #007AFF;\n    background: rgba(0, 122, 255, 0.08);\n    pointer-events: none;\n    display: none;\n    transition: all 0.1s ease;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);\n    border-radius: 2px;\n  ";

    // Create persistent highlight box for selected nodes (solid border)
    var selectedBox = document.createElement("div");
    selectedBox.id = "iframe-selected-box";
    selectedBox.style.cssText = "\n    position: absolute;\n    border: 2px solid #007AFF;\n    pointer-events: none;\n    display: none;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 107, 53, 0.4);\n    border-radius: 2px;\n    z-index: 1000000;\n  ";

    // Create hover label display
    var tagLabel = document.createElement("div");
    tagLabel.id = "iframe-tag-label";
    tagLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 2px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000001;\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n    font-weight: 500;\n  ";

    // Create selected node label
    var selectedLabel = document.createElement("div");
    selectedLabel.id = "iframe-selected-label";
    selectedLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 3px 8px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 3px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000002;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n    font-weight: 600;\n  ";
    overlay.appendChild(highlightBox);
    overlay.appendChild(selectedBox);
    overlay.appendChild(tagLabel);
    overlay.appendChild(selectedLabel);
    document.body.appendChild(overlay);

    // Store currently selected element
    var selectedElement = null;
    var highlightEnabled = false;

    // Update selected element highlight display
    function updateSelectedHighlight(element) {
        console.log("updateSelectedHighlight called with:", element);
        if (!element) {
            selectedBox.style.display = "none";
            selectedLabel.style.display = "none";
            selectedElement = null;
            console.log("Cleared selected highlight");
            return;
        }
        selectedElement = element;
        var rect = element.getBoundingClientRect();
        console.log("Selected element rect:", rect);

        // Update selected highlight box position
        selectedBox.style.display = "block";
        selectedBox.style.left = "".concat(rect.left - 2, "px");
        selectedBox.style.top = "".concat(rect.top - 2, "px");
        selectedBox.style.width = "".concat(rect.width + 4, "px");
        selectedBox.style.height = "".concat(rect.height + 4, "px");

        // Update selected label position and content
        selectedLabel.style.display = "block";
        selectedLabel.textContent = "\u2713 <".concat(element.tagName.toLowerCase(), ">");

        // Calculate label position to ensure it stays in view
        var labelTop = rect.top - 28;
        var labelLeft = rect.left;

        // If label goes off the top, display below the element
        if (labelTop < 5) {
            labelTop = rect.bottom + 5;
        }

        // If label goes off the right edge, adjust left
        var labelWidth = selectedLabel.offsetWidth || 100; // Estimated width
        if (labelLeft + labelWidth > window.innerWidth - 10) {
            labelLeft = window.innerWidth - labelWidth - 10;
        }
        selectedLabel.style.left = "".concat(Math.max(5, labelLeft), "px");
        selectedLabel.style.top = "".concat(labelTop, "px");
        console.log("Selected highlight positioned at:", {
            left: selectedBox.style.left,
            top: selectedBox.style.top,
            width: selectedBox.style.width,
            height: selectedBox.style.height
        });
    }
    function getElementSelector(element) {
        if (!(element instanceof Element)) throw new Error('Argument must be a DOM element');
        var segments = [];
        var current = element;
        while (current !== document.documentElement) {
            var selector = '';
            // Check unique ID first
            if (current.id && document.querySelectorAll("#".concat(current.id)).length === 1) {
                segments.unshift("#".concat(current.id));
                break; // ID is unique, no need to continue up
            }

            // Generate class selector (take the first valid class)
            var classes = Array.from(current.classList).filter(function (c) {
                return !c.startsWith('js-');
            });
            var className = classes.length > 0 ? ".".concat(classes[0]) : '';

            // Generate position index (nth-child)
            var tag = current.tagName.toLowerCase();
            if (!className) {
                var siblings = Array.from(current.parentNode.children);
                var index = siblings.findIndex(function (el) {
                    return el === current;
                }) + 1;
                selector = "".concat(tag, ":nth-child(").concat(index, ")");
            } else {
                selector = className;
            }
            segments.unshift(selector);
            current = current.parentElement;
        }

        // Handle root element
        if (current === document.documentElement) {
            segments.unshift('html');
        }
        return segments.join(' > ');
    }

    // Get element text content
    function getElementText(element) {
        var _element$textContent;
        if (element.tagName === "INPUT") {
            return element.value || element.placeholder || "";
        }
        if (element.tagName === "TEXTAREA") {
            return element.value || element.placeholder || "";
        }
        var text = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim()) || "";
        return text.length > 50 ? text.substring(0, 50) + "..." : text;
    }

    // Get element attributes
    function getElementAttributes(element) {
        var attrs = {};
        for (var i = 0; i < element.attributes.length; i++) {
            var attr = element.attributes[i];
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    // Mouse hover event handler
    function handleMouseOver(e) {
        if (!highlightEnabled) return;
        var target = e.target;
        if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
            return;
        }

        // Avoid highlighting html and body elements
        if (target === document.documentElement || target === document.body) {
            return;
        }

        // If element is already selected, don't show hover highlight
        if (target === selectedElement) {
            highlightBox.style.display = "none";
            tagLabel.style.display = "none";
            return;
        }
        var rect = target.getBoundingClientRect();
        var selector = getElementSelector(target);
        var text = getElementText(target);
        var attributes = getElementAttributes(target);

        // Update hover highlight box position
        highlightBox.style.display = "block";
        highlightBox.style.left = "".concat(rect.left - 2, "px");
        highlightBox.style.top = "".concat(rect.top - 2, "px");
        highlightBox.style.width = "".concat(rect.width + 4, "px");
        highlightBox.style.height = "".concat(rect.height + 4, "px");

        // Update label position and content
        tagLabel.style.display = "block";
        tagLabel.textContent = "<".concat(target.tagName.toLowerCase(), ">");

        // Calculate label position to ensure it stays in view
        var labelTop = rect.top - 22;
        var labelLeft = rect.left;

        // If label goes off the top, display below element
        if (labelTop < 0) {
            labelTop = rect.bottom + 5;
        }

        // If label goes off the right edge, adjust left
        if (labelLeft + tagLabel.offsetWidth > window.innerWidth) {
            labelLeft = window.innerWidth - tagLabel.offsetWidth - 5;
        }
        tagLabel.style.left = "".concat(Math.max(0, labelLeft), "px");
        tagLabel.style.top = "".concat(labelTop, "px");

        // Send message to parent
        var elementInfo = {
            tagName: target.tagName.toLowerCase(),
            rect: {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y
            },
            selector: selector,
            text: text,
            attributes: attributes,
            url: window.location.href,
            path: window.location.pathname,
            timestamp: Date.now()
        };
        try {
            window.parent.postMessage({
                type: "iframe-element-hover",
                data: elementInfo,
                source: "iframe-highlight-injector"
            }, "*");
        } catch (error) {
            console.warn("Could not send message to parent:", error);
        }
    }

    // Mouse out event handler
    function handleMouseOut(e) {
        if (!highlightEnabled) return;
        var relatedTarget = e.relatedTarget;

        // If mouse moves over related highlight elements, don't hide
        if (relatedTarget && (relatedTarget === highlightBox || relatedTarget === tagLabel || relatedTarget === overlay || relatedTarget === selectedBox || relatedTarget === selectedLabel)) {
            return;
        }
        highlightBox.style.display = "none";
        tagLabel.style.display = "none";
        try {
            window.parent.postMessage({
                type: "iframe-element-hover",
                data: null,
                source: "iframe-highlight-injector"
            }, "*");
        } catch (error) {
            console.warn("Could not send message to parent:", error);
        }
    }

    // Click event handler
    function handleClick(e) {
        var target = e.target;
        if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
            return;
        }

        // Avoid handling html and body elements
        if (target === document.documentElement || target === document.body) {
            return;
        }

        // Check if it's an interactive element, preserve default behavior
        var isInteractiveElement = ['input', 'textarea', 'select', 'button', 'a'].includes(target.tagName.toLowerCase());

        // If highlight enabled, prevent default/propagation for non-interactive elements
        if (highlightEnabled) {
            e.preventDefault();
            e.stopPropagation();
        }
        var rect = target.getBoundingClientRect();
        var selector = getElementSelector(target);
        var text = getElementText(target);
        var attributes = getElementAttributes(target);
        console.log("Element clicked:", {
            tagName: target.tagName,
            selector: selector,
            rect: rect
        });

        // Update selected highlight immediately
        updateSelectedHighlight(target);

        // Hide hover highlight because now selected
        highlightBox.style.display = "none";
        tagLabel.style.display = "none";
        var elementInfo = {
            tagName: target.tagName.toLowerCase(),
            rect: {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y
            },
            selector: selector,
            text: text,
            attributes: attributes,
            url: window.location.href,
            path: window.location.pathname,
            timestamp: Date.now()
        };
        try {
            window.parent.postMessage({
                type: "iframe-element-click",
                data: elementInfo,
                source: "iframe-highlight-injector"
            }, "*");
        } catch (error) {
            console.warn("Could not send message to parent:", error);
        }
    }

    // Listen for messages from parent
    function handleParentMessage(event) {
        console.log("Received message from parent:", event.data);
        if (event.data.type === "iframe-highlight-toggle") {
            var enabled = event.data.enabled;
            console.log("Highlight toggle:", enabled);
            if (enabled) {
                enableHighlight();
            } else {
                disableHighlight();
            }
        } else if (event.data.type === "enable-iframe-highlight") {
            console.log("Enable iframe highlight");
            enableHighlight();
        } else if (event.data.type === "disable-iframe-highlight") {
            console.log("Disable iframe highlight");
            disableHighlight();
        } else if (event.data.type === "toggle-iframe-highlight") {
            var _enabled = event.data.enabled !== undefined ? event.data.enabled : !highlightEnabled;
            console.log("Toggle iframe highlight to:", _enabled);
            if (_enabled) {
                enableHighlight();
            } else {
                disableHighlight();
            }
        } else if (event.data.type === "update-selected-element") {
            var selector = event.data.selector;
            console.log("Update selected element with selector:", selector);
            if (selector) {
                try {
                    var element = document.querySelector(selector);
                    console.log("Found element by selector:", element);
                    updateSelectedHighlight(element);
                } catch (error) {
                    console.warn("Failed to select element:", error);
                    updateSelectedHighlight(null);
                }
            } else {
                updateSelectedHighlight(null);
            }
        } else if (event.data.type === "clear-selected-element") {
            console.log("Clear selected element");
            updateSelectedHighlight(null);
        }
    }

    // Enable highlight
    function enableHighlight() {
        console.log("Enabling highlight");
        document.addEventListener("mouseover", handleMouseOver, true);
        document.addEventListener("mouseout", handleMouseOut, true);
        document.addEventListener("click", handleClick, true);
        highlightEnabled = true;
        overlay.style.display = "block";
    }

    // Disable highlight
    function disableHighlight() {
        console.log("Disabling highlight");
        highlightEnabled = false;
        // Maintain event listeners, but control behavior via highlightEnabled variable
        // This retains the display of selected state
        highlightBox.style.display = "none";
        tagLabel.style.display = "none";
        // Do not hide selectedBox and selectedLabel, preserve selection
    }

    // Fully disable highlight (remove all listeners)
    function fullyDisableHighlight() {
        console.log("Fully disabling highlight");
        highlightEnabled = false;
        document.removeEventListener("mouseover", handleMouseOver, true);
        document.removeEventListener("mouseout", handleMouseOut, true);
        document.removeEventListener("click", handleClick, true);
        overlay.style.display = "none";
        highlightBox.style.display = "none";
        tagLabel.style.display = "none";
        selectedBox.style.display = "none";
        selectedLabel.style.display = "none";
    }

    // Add event listeners
    enableHighlight();
    window.addEventListener("message", handleParentMessage);

    // Expose global functions for external call
    window.__iframeHighlightControl = {
        enable: enableHighlight,
        disable: disableHighlight,
        fullyDisable: fullyDisableHighlight,
        isEnabled: function isEnabled() {
            return highlightEnabled;
        },
        getSelectedElement: function getSelectedElement() {
            return selectedElement;
        },
        updateSelected: updateSelectedHighlight,
        // Toggle via message
        sendToggleMessage: function sendToggleMessage(enabled) {
            window.parent.postMessage({
                type: 'iframe-highlight-status',
                enabled: enabled || highlightEnabled,
                source: 'iframe-highlight-injector'
            }, '*');
        }
    };

    // Notify parent script loaded
    try {
        window.parent.postMessage({
            type: "iframe-highlight-ready",
            data: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            },
            source: "iframe-highlight-injector"
        }, "*");
    } catch (error) {
        console.warn("Could not send ready message to parent:", error);
    }

    // Cleanup function
    window.__iframeHighlightCleanup = function () {
        fullyDisableHighlight();
        window.removeEventListener("message", handleParentMessage);
        if (overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
        }
        delete window.__iframeHighlightInitialized;
        delete window.__iframeHighlightCleanup;
    };
})();