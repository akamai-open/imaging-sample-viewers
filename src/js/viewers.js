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

// Depends on jQuery and Galleria

(function($, Akamai) {


    /** 
     * Array that stores the ImViewer instances
     */
    Akamai.ImViewers = [];

    /** 
     * Construct and render the ImViewer
     * @constructor
     */
    Akamai.ImViewer = function(element, options, index) {
        Akamai.ImViewers.push(this);
        this.index = index;
        this.$element = $(element);
        this.options = $.extend(true, {}, options);
        this.options.dimensions = this.options.dimensions || {};
        this.options.imageWidth = this.options.imageWidth || 0;
        this.options.bigWidth = this.options.bigWidth || 0;
        this.options.lastResizeTime = this.options.lastResizeTime || 0;
        this.render($(element).attr("class"));
    };

    /** 
     * Re-initialize the specified ImViewer with new options.
     * @function restartGalleria
     * @memberof Akamai.ImViewer
     * @static
     */
    Akamai.ImViewer.restartGalleria = function(index, options, selector) {
        Galleria.get(index).destroy();
        Akamai.ImViewers.splice(index, 1);
        $("#galleries").empty();
        $("#zoom-container").remove();
        $(selector).viewer(options);
    };

    /** 
     * Load data for ImViewer and then start the render process. 
     */
    Akamai.ImViewer.prototype.render = function() {
        try {
            var self = this;

            this.setDefault();
            var jsonUrl = "";

            if (this.options.dataSource) {
                this.startGalleria(this.options.dataSource, this.options.galleries);
                return;
            } else if (this.options.json) {
                jsonUrl = this.options.json;
            } else {
                this.options.baseUrl = this.options.baseUrl.replace(/\/$/, "");
                jsonUrl += this.options.baseUrl + "/.imviewer?aki_token=" + this.options.lunaToken + "&aki_collection=" + this.options.imageCollectionId;
            }

            $.ajax({
                type: "GET",
                dataType: "json",
                url: jsonUrl,
                contentType: "text/plain",
                success: function(json, textStatus, jqXHR) {
                    self.initializeViewer(json, self.options.viewerSelector);
                },
                error: function() {
                    var comingSoon = {};
                    if (self.options.dummyImage) {
                        comingSoon = $('<img>').attr('src', self.options.dummyImage).attr('class', 'img-responsive').css('width', '100%');
                    } else {
                        comingSoon = $('<p>').html('Image Comming Soon.').css('width', '100%');
                    }
                    $(self.options.viewerSelector).append(comingSoon);
                    console.error("Error retrieving the JSON file.");
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    /** 
     * If there are un-specified required options, throw exception. 
     * If there are un-specified optinal options, set them to the default value. 
     */
    Akamai.ImViewer.prototype.setDefault = function() {
        // These are mandatory and must be set by the user
        if (!this.options.theme) {
            throw "A theme is required to initialize viewer. ";
        }
        if (!this.options.baseUrl) {
            throw "A base URL is required to initialize viewer. ";
        }
        if (!this.options.lunaToken && !this.options.json) {
            throw "A luna token is required to initialize viewer. ";
        }
        if (!this.options.imageCollectionId  && !this.options.json) {
            throw "An image collection ID is required to initialize viewer. ";
        }

        var defaultOptions = {
            rotationInverse: false,
            viewerWidth: '100%',
            viewerHeight: '100%',
            smViewerWidth: '100%',
            smViewerHeight: '100%',
            thumbnailWidth: "50px",
            hoverFocus: false,
            showImageData: false,
            zoomContainer: null,
            zoomWidth: "200px",
            zoomHeight: "200px",
            zoomLevel: 2,
            enableZoom: true,
            viewerSelector: (this.$element.attr("id")) ? ("#" + this.$element.attr("id")) : ("." + this.$element.attr("class")).replace(' ', '.')
        }

        this.options = $.extend(defaultOptions, this.options);
    };

    /**
     * Determine the dimensions of ImViewer and start Galleria with the dimensions
     */
    Akamai.ImViewer.prototype.initializeViewer = function(jsonData) {
        this.updateViewerDimension(this.options.viewerSelector);
        var galleries = [];
        var imageData = this.loadViewerData(jsonData, galleries);
        
        // attach a listener on the browser to detect when it has been resized
        $(window).on('resize', null, {
            jsonData: jsonData,
            index: this.index
        }, this.onViewportResize);

        this.resizeViewer(this.options.viewerSelector, this.options.viewerDimension);

        if (imageData.length > 0) {
            this.startGalleria(imageData, galleries);
        }
    }

    /**
     * Determine the dimensions of ImViewer and store the values in options
     */
    Akamai.ImViewer.prototype.updateViewerDimension = function () {
        var viewportWidth = parseInt($(window).width(), 10);
        var viewportHeight = parseInt($(window).height(), 10);
        if (viewportWidth < 768) {
            this.options.dimensions.width = Akamai.Util.convertToPx(this.options.smViewerWidth, viewportWidth);
            this.options.dimensions.height = Akamai.Util.convertToPx(this.options.smViewerHeight, viewportHeight);
        } else {
            this.options.dimensions.width = Akamai.Util.convertToPx(this.options.viewerWidth, viewportWidth);
            this.options.dimensions.height = Akamai.Util.convertToPx(this.options.viewerHeight, viewportHeight);
        }
    };

    /**
     * Resize the specified viewer to the dimensions stored in options
     */
    Akamai.ImViewer.prototype.resizeViewer = function () {
        var viewportWidth = $(window).width();
        var zoomContainer = this.options.zoomContainer;

        $(this.options.viewerSelector).css('width', this.options.dimensions.width);
        $(this.options.viewerSelector).css('height', this.options.dimensions.height);

        if (zoomContainer && parseInt(viewportWidth, 10) < 768) {
            $(zoomContainer).hide(0);
        } else {
            $(zoomContainer).show(0);
        }
    };

    /**
     * Updates the ImViewer dimension and the image data when the viewport (i.e. browser window) resizes. 
     */
    Akamai.ImViewer.prototype.onViewportResize = function(event) {
        var index = event.data.index;
        var self = Akamai.ImViewers[index];
        if (Date.now() - self.options.lastResizeTime < 50) {
            return;
        }

        var galleria = Galleria.get(index);
        var galleries = [];
        var oldWidth = self.options.dimensions.width;
        self.updateViewerDimension();
        self.resizeViewer();
        self.options.lastResizeTime = Date.now();

        var newImages = self.loadViewerData(event.data.jsonData, galleries);
        galleria.setOptions({
            show: galleria.getIndex()
        });
        galleria.load(newImages);
    };

    /**
     * Start the specified galleria with given options and datas.
     */
    Akamai.ImViewer.prototype.startGalleria = function (imageData, galleries) {
        Galleria.loadTheme(this.options.theme);

        $.extend(true, this.options, {
            dataSource: imageData,
            wait: true,
            transition: "fade",
            preload: 0,
            galleries: galleries,
            imageData: imageData,
            carouselSteps: 1,
            lightbox: false,
            maxScaleRatio: 1,
            metadata: ["dimensions", "size", "type"]
        });

        Galleria.configure(this.options);

        if (this.options.viewerSelector) {
            Galleria.run(this.options.viewerSelector);
        } else {
            console.error("Viewer needs a selector to initialize itself in");
        }
    };

    /**
     * Parse the jsonData into objects that Galleria can use. 
     */
    Akamai.ImViewer.prototype.loadViewerData = function(jsonData, galleries) {
        var imageData = [];
        var galleryIndex = 0;

        this.updateAkiQueryParams(this.options.viewerSelector);
        var akiQueryParams = this.options.akiQueryParams;
        var argObject = { 
            baseUrl: this.options.baseUrl,
            akiQueryParams: this.options.akiQueryParams, 
            allowInnerGallery: true, 
            allowThumbnail: true
        };

        jsonData.items.forEach(function(currentItem) {
            try{
                switch (currentItem.type) {
                    case "Gallery":
                        currentItem.galleryIndex = galleryIndex;
                        var thisGallery = Akamai.parseToImageData(currentItem, argObject);
                        galleries.push(thisGallery);
                        if (galleryIndex === 0) {
                            imageData = imageData.concat(thisGallery.items);
                        }
                        galleryIndex++;
                        break;
                    case "Rotatable":
                        if (this.options.rotationInverse) {
                            currentItem.items.reverse();
                        }
                    case "AkaImage":
                    case "Image":
                        imageData.push(Akamai.parseToImageData(currentItem, argObject));
                        break;
                    default:
                        throw "Invalid type: " + currentItem.type;
                }
            } catch (e) {
                console.error(e);
            }
        }, this);

        return imageData;
    };

    /**
     * Updates the Akami query parameters (e.g. aki_width) and store them in options
     */
    Akamai.ImViewer.prototype.updateAkiQueryParams = function() {
        this.updateViewerDimension(this.options.viewerSelector);

        var viewerWidth = this.options.dimensions.width;
        if (viewerWidth > this.options.bigWidth) {
            this.options.imageWidth = viewerWidth;
            this.options.bigWidth = viewerWidth * this.options.zoomLevel;
        } else if (viewerWidth > this.options.imageWidth) {
            this.options.imageWidth = this.options.bigWidth;
            this.options.bigWidth = viewerWidth * this.options.zoomLevel;
        } else if (viewerWidth * this.options.zoomLevel > this.options.bigWidth) {
            this.options.bigWidth = viewerWidth * this.options.zoomLevel;
        }

        var akiQueryParams = {};
        var akiPolicy = "";
        var akiPolicyThumb = "";
        var akiDensity = ""
        var akiThumbWidth = "aki_width=" + Akamai.Util.convertToPx(this.options.thumbnailWidth, $(".galleria-thumbnails-list").width());
        var akiWidth = "aki_width=" + this.options.imageWidth;
        var akiWidthLarge = "aki_width=" + this.options.bigWidth;

        if (OptimalImageSelector.getIsRetinaDisplay()) {
            akiDensity = "aki_density=2";
        } else {
            akiDensity = "aki_density=1";
        }

        if (this.options.policy) {
            akiPolicy = "aki_policy=" + this.options.policy;
            akiQueryParams.image = "&" + akiPolicy + "&" + akiWidth + "&" + akiDensity;
            akiQueryParams.big = "&" + akiPolicy + "&" + akiWidthLarge + "&" + akiDensity;
        } else {
            akiQueryParams.image = "&" + akiWidth + "&" + akiDensity;
            akiQueryParams.big = "&" + akiWidthLarge + "&" + akiDensity;
        }

        if (this.options.policyThumb) {
            akiPolicyThumb = "aki_policy=" + this.options.policyThumb;
            akiQueryParams.thumb = "&" + akiPolicyThumb + "&" + akiThumbWidth + "&" + akiDensity;
        } else {
            akiQueryParams.thumb = "&" + akiThumbWidth + "&" + akiDensity;
        }

        this.options.akiQueryParams = akiQueryParams;
    };

    /**
     * Calls the constructor for ImViewer for each of the selected HTML element. 
     */
    $.fn.viewer = function(options) {
        return this.each(function(index, _) {
            var $this = $(this);
            var data = $this.data('productViewer');
            
            if (!data) {
                $.data($this, 'productViewer', new Akamai.ImViewer(this, options, index));
            }
        });
    };

})(jQuery, window.Akamai = window.Akamai || {});