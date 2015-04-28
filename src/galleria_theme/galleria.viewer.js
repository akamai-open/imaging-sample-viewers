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
 * Galleria theme file for ImViewer
 * @requires jQuery
 */
(function($, Akamai) {

    Galleria.addTheme({
        name: 'viewer',
        author: 'Galleria',
        css: 'galleria.viewer.css',
        defaults: {
            transition: 'fade',
            transitionSpeed: 300,
            touchTransition: 'slide',
            thumbCrop: 'height',
            metadata: [],
            fullscreenDoubleTap: true,
            // set this to false if you want to show the caption all the time:
            _toggleInfo: true

        },
        init: function(options) {

            Galleria.requires('1.4', 'This theme requires Galleria 1.4 or later');

            var touch = Galleria.TOUCH;
            var metadata = options.metadata;

            /** ----- Helper functions ----- 
             * Local functions used for setup or event binding.
             */
            /**
             * Attach the image-data div to the given image target
             */
            var attachImageData = function(element) {
                var target = $(element);
                if (options.showImageData && metadata.length > 0) {
                    if (options.showImageData == 'hover') {
                        target.imageData({
                            hover: true,
                            metadata: metadata
                        });
                    } else {
                        target.imageData({
                            hover: false,
                            metadata: metadata
                        });
                    }
                }
            };

            /**
             * Create a div element with the background color set to the specified color. 
             * @return jQuery containing the created div element. 
             */
            var createGalleryThumbColor = function(color) {
                var galleryColor = $(document.createElement("div"));
                galleryColor.css("background-color", color);
                return galleryColor;
            };

            /**
             * Create an img element with the src set to the url of given item. 
             * @return jQuery containing the created img element. 
             */
            var createGalleryThumbImage = function(item) {
                var thumbnailSrc = "";
                if (item.type === "AkaImage") {
                    thumbnailSrc = Akamai.Util.parseAkaImagePath(options.baseUrl, item.imageId, options.akiQueryParams.thumb);
                } else {
                    thumbnailSrc = item.imageSrc;
                }
                var galleryThumbnail = $(document.createElement("img"));
                galleryThumbnail.attr('src', thumbnailSrc);
                return galleryThumbnail;
            };

            /**
             * Create a gallery(swatch) icon/thumbnail for the gallery(swatch)
             * @return jQuery containing the created icon/thumbnail. 
             */
            var createGalleryThumbnail = function(galleryItem) {
                if (galleryItem.type === "AkaImage" || galleryItem.type === "Image") {
                    return createGalleryThumbImage(galleryItem);
                } else if (galleryItem.type === "Color") {
                    return createGalleryThumbColor(galleryItem.color);
                }     
            };

            /**
             * Set the opacity of current thumbnail to 1 and opacity of other thumbnails to 0.6. 
             */
            var activate = function(e) {
                $(e.thumbTarget).css('opacity', 1).parent().siblings().children().css('opacity', 0.6);
            };

            /**
             * Append a range input element (slider) to the stage of current Galleria instance. 
             * The slider is used to rotate the Rotatable (306) images on touch device. 
             */
            var addImageSlider = function(imageEvent, touch) {
                var imageSlider = $(document.createElement("input"));
                imageSlider.attr({
                    id: "im-viewer-image-slider",
                    type: "range",
                    max: imageEvent.galleriaData.images.length-1,
                    min: 0,
                    value: 0,
                    style: "top: " + this.$("stage").height() + "px"
                }).on("input", function(inputEvent) {
                    imageEvent.imageTarget.src = imageEvent.galleriaData.images[inputEvent.currentTarget.value];
                    imageEvent.galleriaData.big = imageEvent.galleriaData.bigs[inputEvent.currentTarget.value];
                    
                    // Update image data
                    attachImageData(imageEvent.imageTarget);
                }).addClass("im-viewer-image-slider");

                this.$("stage").after(imageSlider);
            };

            /**
             * Create a 0px by 0px img element for each frame of Rotatable (360) image, and put the img element into a container div element.
             * Insert the div element after the active Rotatable (360) image, so all frames of this image will be fetched. 
             */
            var prefetchRotatableFrames = function(frames) {
                var rotatablePrefetchContainer = document.createElement("div");
                $(rotatablePrefetchContainer).attr({
                    id: "rotatablePrefetchContainer",
                    class: "im-viewer-rotatable-prefetch"
                });

                $.each(frames, function (index, frame) {
                    var rotatablePrefetchFrame = document.createElement("img");
                    $(rotatablePrefetchFrame).attr({
                        id: "rotatablePrefetchFrame" + index,
                        src: frame,
                        class: "im-viewer-rotatable-prefetch"
                    });
                    $(rotatablePrefetchContainer).append(rotatablePrefetchFrame);
                });

                this.$("images").after(rotatablePrefetchContainer);
                rotatablePrefetchContainer;
            };

            /** ----- Event handlers ----- */
            /**
             * 'click' event handler for the gallery icon/thumbnail
             * Load the gallery whose icon/thumbnail was clicked by user. 
             */
            var selectGallery = function(clickEvent) {
                var galleriaIndex = options.index;
                var galleria = Galleria.get(galleriaIndex);
                var selectedGalleryIndex = clickEvent.data.galleryIndex;
                var selectedGalleryItems = options.galleries[selectedGalleryIndex].items;
                var newImages = []; 
                var newGalleryLoaded = false;

                var loadNewGallery = function(index, item) {
                    if ($.isNumeric(item.galleryIndex) && item.galleryIndex != selectedGalleryIndex) {
                        if (!newGalleryLoaded) {
                            newImages = newImages.concat(selectedGalleryItems);
                            newGalleryLoaded = true;
                        }
                    } else {
                        newImages.push(item);
                    }
                };
                $.each(galleria._data, loadNewGallery);

                options.currentGalleryIndex = selectedGalleryIndex;
                options.show = Math.min(galleria.getIndex(), newImages.length-1);;
                options.dataSource = newImages;
                Akamai.ImViewer.restartGalleria(options);
            };

            /**
             * 'mousedown' event handler for the Rotatable(360) image. 
             * Regesters the document element's 'mousemove' and 'mouseup' event to track mouse movement while the mouse button is held down. 
             */
            var drag = function(mousedownEvent) {
                var data = mousedownEvent.data.data;
                var target = mousedownEvent.data.target;
                
                var origX = mousedownEvent.pageX;
                var imageCount = data.images.length;
                var unitLength = target.width / (imageCount - 1);
                
                /**
                 * 'mousemove' event handler. 
                 * Track the movement of the mouse and "rotate" the image accordingly. 
                 */
                var rotate = function(mousemoveEvent) {
                    var displacementX = mousemoveEvent.pageX - origX;
                    var deltaIndex = 0; 
                    if (displacementX > 0) {
                        deltaIndex = Math.floor(displacementX/unitLength);
                    } else if (displacementX < 0) {
                        deltaIndex = Math.ceil(displacementX/unitLength);
                    }

                    if (0 != deltaIndex) {
                        // JavaScript Modulo bug, have to do this.
                        data.index = ((data.index + deltaIndex) % imageCount + imageCount) % imageCount;
                        data.image = data.images[data.index];
                        if(mousedownEvent.data.lightboxOpen) {
                            target.src = data.bigs[data.index];
                        } else {
                            target.src = data.images[data.index];
                            data.big = data.bigs[data.index];
                            $("#main-image-large").attr("src", data.big);
                        }
                        origX = mousemoveEvent.pageX;

                        attachImageData(target);
                    }
                    
                };

                $(document.documentElement).addClass("im-viewer-rotatable-cursor").on("mousemove", rotate).on("mouseup", function() {
                    $(document.documentElement).off("mousemove", rotate).removeClass("im-viewer-rotatable-cursor");
                });
            };

            /** ----- Galleria Event binding ----- 
             * These are events (defined by Galleria) and the handler for each event. 
             */
            /**
             * Gets triggered every time Galleria finishes rendering a thumbnail. 
             * @listens Galliera 'thumbnail' event
             */
            this.bind('thumbnail', function(e) {
                var thumbTarget = $(e.thumbTarget);

                // Add 360 indication if image is 360
                if (e.galleriaData.type == "Rotatable") {
                    var rotatableImg = document.createElement("canvas");
                    $(rotatableImg).attr({
                        id: "rotatableImg"
                    }).addClass("im-viewer-rotatable-icon");
                    
                    thumbTarget.after(rotatableImg);
                }

                if (!touch) {
                    // fade thumbnails
                    thumbTarget.css('opacity', 0.6).parent().hover(function() {
                        $(this).not('.active').children("img").stop().fadeTo(100, 1);
                        if (options.hoverFocus) {
                            var galleria = Galleria.get(options.index);
                            if (e.index != galleria.getIndex()) {
                                galleria.show(e.index);
                            } else {
                                if (($(this).hasClass('active')) && ((Math.round($(this).children('img').css('opacity') * 10) / 10) == 0.6)) {
                                    $(this).children('img').stop().fadeTo(100, 1);
                                }
                            }
                        }
                    }, function() {
                        $(this).not('.active').children("img").stop().fadeTo(100, 0.6);
                    });

                    if (e.index === this.getIndex()) {
                        thumbTarget.css('opacity', 1);
                    }
                } else {
                    thumbTarget.css('opacity', this.getIndex() ? 1 : 0.6).bind('click:fast', function() {
                        $(this).css('opacity', 1).parent().siblings().children().css('opacity', 0.6);
                    });
                }

                attachImageData(e.thumbTarget);
            });

            /**
             * Gets triggered every time Galleria starts to loading a image. 
             * @listens Galliera 'loadstart' event
             */
            this.bind('loadstart', function(e) {
                if (!e.cached) {
                    this.$('loader').show().fadeTo(100, 0.4);
                }
                setTimeout(function() {
                    activate(e);
                }, touch ? 300 : 0);
            });

            /**
             * Gets triggered every time Galleria finishes loading a image. 
             * @listens Galliera 'loadfinish' event
             */
            this.bind('loadfinish', function(e) {
                this.$('loader').fadeOut(100);

                this.$('container').find('#magnifier-zoom-wrapper, #im-viewer-image-slider, #rotatablePrefetchContainer, .galleria-stage .im-viewer-image-data').remove();
                $(options.zoomContainer).empty();

                if (options.enableZoom && !touch && e.galleriaData.type != "Rotatable") {
                    var largeImageSrc = this.getData(e.index).big;
                    Akamai.Magnifier.attach(e.imageTarget, largeImageSrc, options);
                }

                if (e.galleriaData.type === "Rotatable") {
                    prefetchRotatableFrames.call(this, e.galleriaData.images);

                    if (touch) {
                        // The image will always start at frame 0, so reset the lightbox image accordingly. 
                        e.galleriaData.big = e.galleriaData.bigs[0];
                        addImageSlider.call(this, e);
                    } else {
                        $(e.imageTarget).addClass('im-viewer-rotatable-cursor')
                        .on("mousedown", {data: e.galleriaData, target: e.imageTarget, lightboxOpen: false}, drag);
                    }
                }
            });
    
            /**
             * Gets triggered every time Galleria finishes rendering an image. 
             * @listens Galliera 'image' event
             */
            this.bind('image', function(e) {
                attachImageData(e.imageTarget);
            });

            /**
             * Gets triggered every time Galleria finishes rendering a image in lightbox. 
             * @listens Galliera 'lightbox_image' event
             */
            this.bind('lightbox_image', function(e) {
                attachImageData(e.imageTarget);
                
                $("#rotatablePrefetchContainer").remove();

                var data = this.getData(this._lightbox.active);

                if (data.type === "Rotatable") {
                    $(e.imageTarget).addClass("im-viewer-rotatable-cursor");
                    prefetchRotatableFrames.call(this, data.bigs);
                    $('div.galleria-lightbox-image img').on("mousedown", {data: data, target: e.imageTarget, lightboxOpen: true}, drag);
                }

                $(".galleria-lightbox-box.iframe, .galleria-lightbox-box.iframe").on("selectstart", function(e) {
                    e.preventDefault();
                }).on("dragstart", function(e) {
                    e.preventDefault();
                }).attr("unselectable", "on");
                
            });

            /**
             * Gets triggered every time Galleria resizes. 
             * @listens Galliera 'rescale' event
             */
            this.bind("rescale", function(e) {
                attachImageData("#main-image");
            });

            /** ----- SETUP ----- 
             * Starting form here till the end of file, theses codes will only run once when Galleria initializes.  
             */
            // Empty the Galleria info div
            this.$('info').empty();

            // Set up the Magnifier viewport if Magnifier is enable with mode 'outside'
            if (!touch && options.zoomContainer && options.zoomMode == 'outside') {
                $(options.zoomContainer).css({
                    'width': options.zoomWidth,
                    'height': options.zoomHeight,
                    'display': 'block',
                    'overflow': 'hidden'
                }).addClass("im-viewer-zoom-container");
            }

            // show loader & counter with opacity
            this.$('loader,counter').show().css('opacity', 0.6);

            // Setup the gallery container and the gallery(swatch) icon/thumbnail if there is any gallery(swatch) in the ordered image collection. 
            if (options.galleries) {
                var galleryContainer = $(options.galleryContainer);
                if (galleryContainer.length > 0) {
                    var fragment = $(document.createDocumentFragment());
                    galleryContainer.addClass("im-viewer-galleries-container");

                    $.each(options.galleries, function(index, currentGallery) {
                        var galleryThumbnail = null;
                        if (currentGallery.thumbnail) {
                            galleryThumbnail = createGalleryThumbnail(currentGallery.thumbnail);
                        } else {
                            galleryThumbnail = createGalleryThumbnail(currentGallery.items[0]);
                        }
                        
                        if (galleryThumbnail) {
                            galleryThumbnail.on("click", { galleryIndex: index }, selectGallery);
                            galleryThumbnail.addClass("im-viewer-gallery-thumbnail");

                            if (currentGallery.galleryIndex == options.currentGalleryIndex) {
                                galleryThumbnail.addClass("im-viewer-gallery-selected");
                            }
                            fragment.append(galleryThumbnail);
                        } else {
                            console.log("Thumbnail type of Gallery is not supported. ");
                        }
                    });

                    galleryContainer.append(fragment);
                } else {
                    console.log("The galleryContainer specified '" + options.galleryContainer + "' cannot be found. ");
                }
            }

             // Disable selection, so elements won't get selected when user drags the threesixty
            this.$("container").find('*').on("selectstart", function(e) {
                e.preventDefault();
            }).on("dragstart", function(e) {
                e.preventDefault();
            }).attr("unselectable", "on");

            // some stuff for non-touch browsers
            if (!touch) {
                this.addIdleState(this.get('counter'), {
                    opacity: 0
                });

                // light box button
                var lightboxImg = $(document.createElement("canvas"));
                lightboxImg.attr({
                    id: "lightboxImg",
                    style: "top: " + this.$("stage").height() + "px"
                }).click(
                    this.proxy(function() {
                        this.openLightbox();
                    })
                ).addClass("im-viewer-lightbox-icon");

                this.$("images").after(lightboxImg);
            } 
        }
    });

}(jQuery, window.Akamai = window.Akamai || {}));