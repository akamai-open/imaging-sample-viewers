/*
 * Copyright 2015 Akamai Technologies, Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Magnifier module
 * @module Akamai/Magnifier
 * @requires jQuery
 */
(function($, Akamai) {

    /**
     * @abstract
     * Constructor for the Magnifier
     */
    Akamai.Magnifier = function () {}; 

    /**
     * Attach Magnifier to the element
     */
    Akamai.Magnifier.attach = function (element, largeImageSrc, options) {

        if (options.zoomMode == "outside") {
            if (!options.zoomContainer) {
                throw "Missing required option zoomContainer. "
            }
            if ($(options.zoomContainer).is(":visible")) {
                Akamai.Magnifier.outside(element, largeImageSrc, options);
            }
        } else if (options.zoomMode == "inside") {
            Akamai.Magnifier.inside(element, largeImageSrc, options);
        } else {
            throw "Invalid zoomMode. ";
        }
    }; 

    /**
     * Mode 'inside'
     */
    Akamai.Magnifier.inside = function (element, largeImageSrc, options) {
        // Make the zoom wapper overlay the normal image
        var zoomContainer = $(document.createElement("div"));
        var imageTarget = $(element);

        zoomContainer.css({
            'position': 'absolute',
            'top': imageTarget.css('top'),
            'left': imageTarget.css('left'),
            'width': imageTarget.width(),
            'height': imageTarget.height(),
            'overflow': 'hidden'
        }).attr('id', 'largeContainer').addClass("im-viewer-magnified-image-overlay");
        
        // Create the large image element 
        var largeHeight = imageTarget.height() * options.zoomLevel;
        var largeWidth = imageTarget.width() * options.zoomLevel;
        var largeImage = $(document.createElement('img'));
        largeImage.attr({
            'src': largeImageSrc, 
            'id': "largeImage"
        }).css({
            'display': 'none',
            'position': 'absolute',
            'width': largeWidth,
            'height': largeHeight
        });

        zoomContainer.append(largeImage);
        
        var onContainerMouseEnter = function(enterEvent) {
            largeImage.css("display", "block");

            var onContainerMouseMove = function(moveEvent) {
                // Calculate relative mouse position
                var rect = this.getBoundingClientRect();
                var mouseX = moveEvent.clientX - rect.left;
                var mouseY = moveEvent.clientY - rect.top;

                // Calculate and set large image top and left
                var largeX = mouseX * (1 - options.zoomLevel); 
                var largeY = mouseY * (1 - options.zoomLevel); 
                largeImage.css({
                    'left': largeX + "px",
                    'top': largeY + "px"
                })
            }

            zoomContainer.on("mousemove", onContainerMouseMove).on("mouseleave", function() {
                zoomContainer.off("mousemove", onContainerMouseMove);
                largeImage.css("display", "none");
            });
        }

        zoomContainer.on("mouseenter", onContainerMouseEnter);
        imageTarget.after(zoomContainer);
    }

    /**
     * Mode 'outside'
     */
    Akamai.Magnifier.outside = function (element, largeImageSrc, options) {
        var imageTarget = $(element);
        var zoomWrapper = $(document.createElement('a'));
        var zoomContainer = $(options.zoomContainer);
        
        imageTarget.attr('id', 'main-image');
        zoomWrapper.attr('id', 'magnifier-zoom-wrapper');
        imageTarget.wrap(zoomWrapper);

        // Create the large image element 
        var imageWidth = imageTarget.width()
        var imageHeight = imageTarget.height()
        var largeWidth = imageWidth * options.zoomLevel;
        var largeHeight = imageHeight * options.zoomLevel;
        var largeImage = $(document.createElement('img'));

        largeImage.css({
            'visibility': 'hidden',
            'position': 'relative',
            'width': largeWidth,
            'height': largeHeight
        }).attr({
            'src': largeImageSrc, 
            'id': "largeImage"
        });
        zoomContainer.append(largeImage);

        // Create the magnifier lens
        var lens = $(document.createElement('div'));
        var lensWidth = Math.round(Akamai.Util.convertToPx(options.zoomWidth, zoomContainer.parent().height()) / options.zoomLevel);
        var lensHeight = Math.round(Akamai.Util.convertToPx(options.zoomHeight, zoomContainer.parent().height()) / options.zoomLevel);

        lens.addClass("im-viewer-zoom-lens").css({
            'display': 'none',
            'width': lensWidth,
            'height': lensHeight
        }).attr('id', 'magnifier-lens');
        imageTarget.after(lens);
        
        var onImageMouseEnter = function(enterEvent) {
            largeImage.css("visibility", "visible");
            lens.css("display", "block");

            var onImageMouseMove = function(moveEvent) {
                // Calculate relative mouse position
                var mouseRec = this.getBoundingClientRect();
                var mouseX = moveEvent.clientX - mouseRec.left;
                var mouseY = moveEvent.clientY - mouseRec.top;

                if (mouseX < lensWidth / 2) {
                    mouseX = lensWidth / 2;
                } else if (mouseX + lensWidth / 2 - imageWidth >= 0) {
                    mouseX = imageWidth - (lensWidth / 2);
                }
                if (mouseY < lensHeight / 2) {
                    mouseY = lensHeight / 2;
                } else if (mouseY + lensHeight / 2 - imageHeight >= 0) {
                    mouseY = imageHeight - (lensHeight / 2);
                }

                // Calculate image offset
                var imageRec = element.getBoundingClientRect();
                var imageX = imageTarget.css('left').replace('px', '');
                var imageY = imageTarget.css('top').replace('px', '');

                var lensX = mouseX + Number(imageX) - lensWidth / 2;
                var lensY = mouseY + Number(imageY) - lensHeight / 2;

                lensX = (lensX < 0) ? 0 : lensX;
                lensY = (lensY < 0) ? 0 : lensY;

                lens.css({
                    'left': lensX,
                    'top': lensY
                });

                // Calculate and set large image top and left
                var largeX = (lensWidth / 2 - mouseX) * options.zoomLevel; 
                var largeY = (lensHeight / 2 - mouseY) * options.zoomLevel; 

                largeImage.css({
                    'left': largeX + "px",
                    'top': largeY + "px"
                })
            }

            imageTarget.on("mousemove", onImageMouseMove).on("mouseleave", function() {
                imageTarget.off("mousemove", onImageMouseMove);
                largeImage.css("visibility", "hidden");
                lens.css("display", "none");
            });
        }

        imageTarget.on("mouseenter", onImageMouseEnter);
    }

})(jQuery, window.Akamai = window.Akamai || {});