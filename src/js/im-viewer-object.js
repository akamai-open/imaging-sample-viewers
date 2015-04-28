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
 * ImViewer Objects
 * @requires jQuery
 */
(function($, Akamai) {

    /**
     * Call the appropriate constructor according to the item.type
     */
    Akamai.parseToImageData = function(item, argObject) {
        switch (item.type) {
            case "AkaImage":
                return new Akamai.AkaImage(item, argObject);
            case "Image":
                return new Akamai.Image(item, argObject);
            case "Color":
                return new Akamai.Color(item);
            case "Gallery":
                if (argObject.allowInnerGallery) {
                    return new Akamai.Gallery(item, argObject);
                } else {
                    throw "Nested Gallery is not allowed."
                }
            case "Rotatable":
                return new Akamai.Rotatable(item, argObject);
            default: 
                throw "The type '" + item.type + "' is invalid."
        }
    };

    /**
     * @abstract
     */
    Akamai.Viewable = function(item, argObject) {
        this.type = item.type;

        if (item.thumbnail && argObject.akiQueryParams && argObject.allowThumbnail) {
            var thumbArgObject = $.extend({}, argObject, { 
                allowInnerGallery: false,
                allowThumbnail: false 
            });
            this.thumbnail = Akamai.parseToImageData(item.thumbnail, thumbArgObject);
        }
    };

    /**
     * @abstract
     * @augments Akamai.Viewable
     */
    Akamai.ViewableCollection = function(items, argObject) {
        Akamai.Viewable.call(this, items, argObject);

        this.items = items;
    };
    
    /**
     * @constructor
     * @augments Akamai.Viewable
     */
    Akamai.AkaImage = function(item, argObject) {
        Akamai.Viewable.call(this, item, argObject);

        this.imageId = item.imageId;
        this.thumb = Akamai.Util.getThumbnailUrl(this) || Akamai.Util.parseAkaImagePath(argObject.baseUrl, this.imageId, argObject.akiQueryParams.thumb);
        this.image = Akamai.Util.parseAkaImagePath(argObject.baseUrl, this.imageId, argObject.akiQueryParams.image);
        this.big = Akamai.Util.parseAkaImagePath(argObject.baseUrl, this.imageId, argObject.akiQueryParams.big);
    };

    Akamai.AkaImage.prototype = Object.create(Akamai.Viewable.prototype);
    Akamai.AkaImage.prototype.constructor = Akamai.AkaImage;

    /**
     * @constructor
     * @augments Akamai.Viewable
     */
    Akamai.Image = function(item, argObject) {
        Akamai.Viewable.call(this, item, argObject);

        this.imageSrc = item.imageSrc;
        this.thumb = Akamai.Util.getThumbnailUrl(this) || this.imageSrc;
        this.image = this.imageSrc;
        // TODO: check if big src is somehow specified.
        this.big = this.imageSrc;
    };
    
    Akamai.Image.prototype = Object.create(Akamai.Viewable.prototype);
    Akamai.Image.prototype.constructor = Akamai.Image;

    /**
     * @constructor
     * @augments Akamai.Viewable
     */
    Akamai.Color = function(item, argObject) {
        Akamai.Viewable.call(this, item, argObject);

        this.color = item.color;
    };
    
    Akamai.Color.prototype = Object.create(Akamai.Viewable.prototype);
    Akamai.Color.prototype.constructor = Akamai.Color;    

    /**
     * @constructor
     * @augments Akamai.ViewableCollection
     */
    Akamai.Gallery = function(item, argObject) {
        Akamai.ViewableCollection.call(this, item, argObject);

        this.items = [];
        this.galleryIndex = item.galleryIndex;
        var galleryArgObject = $.extend({}, argObject, { 
            allowInnerGallery: false,
            allowThumbnail: true 
        });

        item.items.forEach(function (currentItem) {
            var galleryItem = Akamai.parseToImageData(currentItem, galleryArgObject);
            galleryItem.galleryIndex = item.galleryIndex;
            this.items.push(galleryItem);
        }, this);
    };
    
    Akamai.Gallery.prototype = Object.create(Akamai.ViewableCollection.prototype);
    Akamai.Gallery.prototype.constructor = Akamai.Gallery;

    /**
     * @constructor
     * @augments Akamai.ViewableCollection
     */
    Akamai.Rotatable = function(item, argObject) {
        Akamai.ViewableCollection.call(this, item, argObject);

        this.images = [];
        this.bigs = [];
        this.index = 0;

        item.items.forEach(function(currentItem, currentIndex) {
            var imageData = Akamai.parseToImageData(currentItem, argObject);

            if (item.type == "Color") {
                throw "'Color' is not a valid thumbnail type for 'Rotatable'."
            }

            if (currentIndex == 0) {
                this.thumb = Akamai.Util.getThumbnailUrl(imageData) || Akamai.Util.getImageUrl(imageData);
                this.image = Akamai.Util.getImageUrl(imageData);
                this.big = Akamai.Util.getBigUrl(imageData) || Akamai.Util.getImageUrl(imageData);
            }

            this.images.push(Akamai.Util.getImageUrl(imageData));
            this.bigs.push(Akamai.Util.getBigUrl(imageData));
        }, this);
    };
    
    Akamai.Rotatable.prototype = Object.create(Akamai.ViewableCollection.prototype);
    Akamai.Rotatable.prototype.constructor = Akamai.Rotatable;

})(jQuery, window.Akamai = window.Akamai || {});