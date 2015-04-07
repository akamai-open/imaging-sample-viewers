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

(function($, Akamai) {

    /*global window, jQuery, Galleria */

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
            _toggleInfo: false

        },
        init: function(options) {

            Galleria.requires(1.4, 'This theme requires Galleria 1.4 or later');

            var touch = Galleria.TOUCH;
            var metadata = options.metadata;
            var _zoomWindow = null;
            var _currentSwatchImg = null;

            var selectGallery = function(clickEvent) {
                // TODO: get the current ImViewer instance index, hard coded to 0 as right now we only support one Galleria instance on the page. 
                var galleriaIndex = 0;
                var galleria = Galleria.get(galleriaIndex);
                var selectedGalleryIndex = clickEvent.data.galleryIndex;
                var selectedGalleryItems = options.galleries[selectedGalleryIndex].items;
                var existingImageData = galleria._data;
                var newImageData = []; 
                var newGalleryLoaded = false;

                var loadNewGallery = function(index, item) {
                    if ($.isNumeric(item.galleryIndex) && item.galleryIndex != selectedGalleryIndex) {
                        if (!newGalleryLoaded) {
                            newImageData = newImageData.concat(selectedGalleryItems);
                            newGalleryLoaded = true;
                        }
                    } else {
                        newImageData.push(item);
                    }
                };
                $.each(existingImageData, loadNewGallery);

                options.show = Math.min(galleria.getIndex(), newImageData.length-1);;
                options.dataSource = newImageData;
                Akamai.ImViewer.restartGalleria(0, options, ".galleria");
            };

            // Click and drag for threesixty
            var drag = function(mousedownEvent) {
                var option = Galleria.get(0)._option;
                var data = mousedownEvent.data.data;
                var target = mousedownEvent.data.target;
                
                var origX = mousedownEvent.pageX;
                var lightboxOpen = mousedownEvent.data.lightboxOpen;
                var imageCount = data.images.length;
                var unitLength = target.width / (imageCount - 1);
                var displacementX = 0;
                var deltaIndex = 0;
                var documentElement = $(document.documentElement).addClass("rotatable-cursor");
                
                var rotate = function(mousemoveEvent) {
                    displacementX = mousemoveEvent.pageX - origX;
                    if (displacementX > 0) {
                        deltaIndex = Math.floor(displacementX/unitLength);
                    } else if (displacementX < 0) {
                        deltaIndex = Math.ceil(displacementX/unitLength);
                    }

                    if(0 < deltaIndex) {
                        data.index = (data.index + deltaIndex) % imageCount;
                        data.image = data.images[data.index];
                        if(lightboxOpen) {
                            target.src = data.bigs[data.index];
                        } else {
                            target.src = data.images[data.index];
                            data.big = data.bigs[data.index];
                            $("#main-image-large").attr("src", data.big);
                        }
                        origX = mousemoveEvent.pageX;
                    } else if (0 > deltaIndex) {
                        // JavaScript Modulo bug, have to do this.
                        data.index = (((data.index + deltaIndex) % imageCount) + imageCount) % imageCount;
                        data.image = data.images[data.index];
                        if(lightboxOpen) {
                            target.src = data.bigs[data.index];
                        } else {
                            target.src = data.images[data.index];
                            data.big = data.bigs[data.index];
                            $("#main-image-large").attr("src", data.big);
                        }
                        origX = mousemoveEvent.pageX;
                    }
                }

                documentElement.on("mousemove", rotate).on("mouseup", function() {
                    documentElement.off("mousemove", rotate).removeClass("rotatable-cursor");
                });
            };

            var createGalleryColor = function(item) {
                galleryColor = $("<div>", {
                    style: "background-color:" + item.color + ";"
                }).addClass("gallery-thumbnail not-selected");
                return galleryColor;
            };

            var createGalleryThumbnail = function(item) {
                var thumbnailSrc = "";
                if (item.type === "AkaImage") {
                    thumbnailSrc = Akamai.Util.parseAkaImagePath(options.baseUrl, item.imageId, options.akiQueryParams.thumb);
                } else {
                    thumbnailSrc = item.imageSrc;
                }
                galleryThumbnail = $("<img>", {
                    src: thumbnailSrc
                }).addClass("gallery-thumbnail not-selected");
                return galleryThumbnail;
            };

            // disable selection, so elements won't get selected when user drags the threesixty
            $(".galleria, .galleria *").on("selectstart", function(e) {
                e.preventDefault();
            }).on("dragstart", function(e) {
                e.preventDefault();
            }).attr("unselectable", "on");

            // show loader & counter with opacity
            this.$('loader,counter').show().css('opacity', 0.6);

            var addImageSlider = function(imageEvent, touch) {
                var imageSlider = document.createElement("INPUT");
                $(imageSlider).attr({
                    id: "image-slider",
                    type: "range",
                    max: imageEvent.galleriaData.images.length-1,
                    min: 0,
                    value: 0,
                    style: "top: " + $(".galleria-stage").height() + "px"
                }).on("input", function(inputEvent) {
                    imageEvent.imageTarget.src = imageEvent.galleriaData.images[inputEvent.currentTarget.value];
                    imageEvent.galleriaData.big = imageEvent.galleriaData.bigs[inputEvent.currentTarget.value];
                }).addClass("image-slider");
                
                $(".galleria-stage").after(imageSlider);
            };

            var activate = function(e) {
                $(e.thumbTarget).css('opacity', 1).parent().siblings().children().css('opacity', 0.6);
            };

            // some stuff for non-touch browsers
            if (!touch) {
                this.addIdleState(this.get('counter'), {
                    opacity: 0
                });

                // light box button
                var lightboxImg = document.createElement("I");
                $(lightboxImg).attr({
                    id: "lightboxImg",
                    style: "top: " + $(".galleria-stage").height()
                }).click(
                    this.proxy(function() {
                        this.openLightbox();
                    })
                ).addClass("icon ion-android-open lightbox-icon");
                
                $(".galleria-images").after(lightboxImg);
            }

            this.$('info').empty();

            if (options.zoomContainer) {
                _zoomWindow = $("<div>", {
                    class: "magnifier-preview",
                    id: 'zoom-container'
                });
                _zoomWindow.css('width', options.zoomWidth);
                _zoomWindow.css('height', options.zoomHeight);
                $(options.zoomContainer).append(_zoomWindow);
            }

            // Setup the Gallery container and the galleries. 
            if (options.galleries) {
                var fragment = $(document.createDocumentFragment());
                var galleryContainer = null;
                if (options.galleryContainer) {
                    galleryContainer = $(options.galleryContainer);
                } else {
                    galleryContainer = $("<div>", {
                        id: "galleries"
                    });
                    galleryContainer.insertAfter(this.$("container"));
                }
                galleryContainer.addClass("galleries-container");

                $.each(options.galleries, function(index, currentGallery) {
                    var galleryThumbnail = null;
                    if (currentGallery.thumbnail) {
                        if (currentGallery.thumbnail.type === "AkaImage" || currentGallery.thumbnail.type === "Image") {
                            galleryThumbnail = createGalleryThumbnail(currentGallery.thumbnail);
                        } else if (currentGallery.thumbnail.type === "Color") {
                            galleryThumbnail =createGalleryColor(currentGallery.thumbnail);
                        }
                    } else {
                        if (currentGallery.items[0].type === "AkaImage" || currentGallery.items[0].type === "Image") {
                            galleryThumbnail = createGalleryThumbnail(currentGallery.items[0]);
                        } else if (currentGallery.items[0].type === "Color") {
                            galleryThumbnail = createGalleryColor(currentGallery.items[0]);
                        } 
                        // TODO: Add support for Rotatable and other stuff
                    }
                    
                    if (galleryThumbnail) {
                        galleryThumbnail.on("click", { galleryIndex: index }, selectGallery);
                        galleryThumbnail.addClass("gallery-thumbnail");
                        fragment.append(galleryThumbnail);
                    } else {
                        console.log("Thumbnail type of Gallery is not supported. ");
                    }
                });

                galleryContainer.append(fragment);
            }

            // bind some stuff
            this.bind('loadstart', function(e) {
                if (!e.cached) {
                    this.$('loader').show().fadeTo(100, 0.4);
                }
                window.setTimeout(function() {
                    activate(e);
                }, touch ? 300 : 0);
            });

            this.bind('loadfinish', function(e) {
                this.$('loader').fadeOut(100);

                $('.magnifier-thumb-wrapper, .magnifier-lens, #image-slider, #rotatableImg, #rotatablePrefetchContainer, .galleria-stage .galleria-image .image-data').remove();
                $('.magnifier-preview').empty();

                // Only attach the magnifier if not on a mobile
                if (options.enableZoom && !touch && options.zoomContainer && parseInt($(window).width(), 10) >= 768 && e.galleriaData.type != "Rotatable") {
                    var zoomWrapperId = options.zoomContainer;
                    if (zoomWrapperId !== undefined) {
                        var evt = new Event(),
                            m = new Magnifier(evt);
                        $(e.imageTarget).attr('id', 'main-image');
                        var zoomWrapper = document.createElement('a');
                        var fullImage = this.getData(e.index).big;
                        m.attach({
                            thumb: '#main-image',
                            large: fullImage,
                            largeWrapper: _zoomWindow.attr('id'),
                            zoom: options.zoomLevel,
                            onthumbenter: function (eventData) {
                                $('.magnifier-lens').removeAttr('style').addClass('zoom-lens');
                            },
                            onthumbmove: function(eventData) {
                                if (!$('.magnifier-lens').css('left')) {
                                    return;
                                }

                                $('.magnifier-lens').removeAttr('style').addClass('zoom-lens');

                                var zoom = options.zoomLevel;
                                var imageHeight = $(e.imageTarget).height();
                                var imageWidth = $(e.imageTarget).width();
                                var largeHeight = imageHeight * zoom;
                                var largeWidth = imageWidth * zoom;

                                $(eventData.large).height(largeHeight).width(largeWidth);

                                var zoomHeight = $(options.zoomContainer).children(":first").height();;
                                var zoomWidth = $(options.zoomContainer).children(":first").width();

                                var lensHeight = Math.round(zoomHeight / zoom);
                                var lensWidth = Math.round(zoomWidth / zoom);

                                $(eventData.lens).height(lensHeight).width(lensWidth);

                                var wapper = jQuery('.magnifier-thumb-wrapper').children(":first");

                                var xOffset = wapper.css("left").replace("px", "");
                                var yOffset = wapper.css("top").replace("px", "");

                                var left = eventData.x - xOffset;
                                var top = eventData.y - yOffset;

                                if (left < lensWidth / 2) {
                                    left = lensWidth / 2;
                                } else if (left + lensWidth / 2 - imageWidth >= 0) {
                                    left = imageWidth - (lensWidth / 2 + 2);
                                }
                                if (top < lensHeight / 2) {
                                    top = lensHeight / 2;
                                } else if (top + lensHeight / 2 - imageHeight >= 0) {
                                    top = imageHeight - (lensHeight / 2 + 2);
                                }

                                var lensLeft = left + Number(xOffset) - lensWidth / 2;
                                var lensTop = top + Number(yOffset) - lensHeight / 2;

                                lensLeft = (lensLeft < 0) ? 0 : lensLeft;
                                lensTop = (lensTop < 0) ? 0 : lensTop;

                                $('.magnifier-lens').css({
                                    'left': lensLeft,
                                    'top': lensTop
                                });

                                var largeLeft = (lensLeft == 0) ? 0 : 0 - Math.round( (left - lensWidth / 2) * zoom);
                                var largeTop = (lensTop == 0) ? 0 : 0 - Math.round( (top - lensHeight / 2) * zoom);

                                $(eventData.large).css("left", largeLeft + "px").css("top", largeTop + "px");
                            }
                        });
                        $(zoomWrapper).addClass('magnifier-thumb-wrapper');
                        $(e.imageTarget).wrap(zoomWrapper);
                    }
                }

                if (e.galleriaData.type === "Rotatable") {
                    // prefetch all frames
                    var rotatablePrefetchContainer = document.createElement("DIV");
                    $(rotatablePrefetchContainer).attr({
                        id: "rotatablePrefetchContainer",
                        class: "rotatable-prefetch"
                    });

                    $.each(e.galleriaData.images, function (index, image) {
                        var rotatablePrefetchImage = document.createElement("IMG");
                        $(rotatablePrefetchImage).attr({
                            id: "rotatablePrefetchImage" + index,
                            src: image,
                            class: "rotatable-prefetch"
                        });
                        $(rotatablePrefetchContainer).append(rotatablePrefetchImage);
                    });

                    $(".galleria-images").after(rotatablePrefetchContainer);

                    if (touch) {
                        // The image will always start at frame 0, so reset the lightbox image accordingly. 
                        e.galleriaData.big = e.galleriaData.bigs[0];
                        addImageSlider(e);
                    } else {
                        $(e.imageTarget).addClass('rotatable-cursor')
                        .on("mousedown", {data: e.galleriaData, target: e.imageTarget, lightboxOpen: false}, drag);
                    }
                }
            });

            this.bind('image', function(e) {
                // Attach Image Metadata
                if (metadata.length > 0) {
                    imageTarget = $(e.imageTarget);

                    // Wait until the image is FULLY rendered, so the image-data.js knows where to add the image info
                    setTimeout(function() {
                        imageTarget.show(1, function() {
                            imageTarget.imageData({
                                hover: false,
                                metadata: metadata
                            });
                        });
                    }, 0);
                }
            });

            this.bind('thumbnail', function(e) {
                if (!touch) {
                    // fade thumbnails
                    $(e.thumbTarget).css('opacity', 0.6).parent().hover(function() {
                        $(this).not('.active').children("img").stop().fadeTo(100, 1);
                        if (options.hoverFocus) {
                            var gallery = Galleria.get(0);
                            if (e.index != gallery.getIndex()) {
                                gallery.show(e.index);
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
                        $(e.thumbTarget).css('opacity', 1);
                    }
                } else {
                    $(e.thumbTarget).css('opacity', this.getIndex() ? 1 : 0.6).bind('click:fast', function() {
                        $(this).css('opacity', 1).parent().siblings().children().css('opacity', 0.6);
                    });
                }

                if (metadata.length > 0) {
                    $(e.thumbTarget).imageData({
                        metadata: metadata
                    });
                }
            });

            this.bind('lightbox_image', function(e) {
                $(e.imageTarget).imageData({
                    hover: false,
                    metadata: metadata
                });

                $("#rotatablePrefetchContainer").remove();

                var data = this.getData(this._lightbox.active);

                if (data.type === "Rotatable") {

                    // prefetch all frames
                    var rotatablePrefetchContainer = document.createElement("DIV");
                    $(rotatablePrefetchContainer).attr({
                        id: "rotatablePrefetchContainer",
                        class: "rotatable-prefetch"
                    });

                    $.each(data.bigs, function (index, bigImage) {
                        var rotatablePrefetchImage = document.createElement("IMG");
                        $(rotatablePrefetchImage).attr({
                            id: "rotatablePrefetchImage" + index,
                            src: bigImage,
                            class: "rotatable-prefetch"
                        });
                        $(rotatablePrefetchContainer).append(rotatablePrefetchImage);
                    });

                    $(".galleria-images").after(rotatablePrefetchContainer);

                    $('div.galleria-lightbox-image img').on("mousedown", {data: data, target: e.imageTarget, lightboxOpen: true}, drag);
                }

                $(".galleria-lightbox-box.iframe, .galleria-lightbox-box.iframe *").on("selectstart", function(e) {
                    e.preventDefault();
                }).on("dragstart", function(e) {
                    e.preventDefault();
                }).attr("unselectable", "on");
                
            });

            this.bind("rescale", function(e) {
                $("#main-image").imageData({
                    hover: false,
                    metadata: metadata
                });
            });
        }
    });

}(jQuery, window.Akamai = window.Akamai || {}));