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

// Depends on jQuery

(function($, Akamai) {

    /**
     * Empty constructor. All methods of this class is static. 
     */
    Akamai.Util = function () {}

    /**
     * Takes in a css numeric value (number, px, percentage) and return the number with unit px. 
     */
    Akamai.Util.convertToPx = function(value, refValue) {
        if (typeof value === 'number') {
            return parseInt(value);
        } else if (typeof value === 'string') {
            if (value.indexOf("px") !== -1) {
                return parseInt(value.slice(0, value.length - 2));
            } else if (value.indexOf("%") !== -1) {
                return parseInt(value.slice(0, value.length - 1) * refValue / 100);
            } else {
                return parseInt(value);
            }
        }
    }

    /**
     * Takes in the base url, the path to the image (may have query parameters), and the Akamai
     * query parameters. Return the complete image url. 
     */
    Akamai.Util.parseAkaImagePath = function(baseUrl, imagePath, params) {
        var questionMarkOrAmpersand = /\?|\&/;

        var imageUrl = baseUrl + imagePath + params;
        imageUrl = imageUrl.replace(questionMarkOrAmpersand, "?");
        return imageUrl.replace(questionMarkOrAmpersand, "?");
    }

    /**
     * Takes in the base url, an arry of image path(may have query parameters), and the Akamai
     * query parameters. Return an array of complete image url. 
     */
    Akamai.Util.parseRotatableData = function(baseUrl, images, params) {
        var imageData = [];
        $.each(images, function(index, image) {
            var imageUrl = Akamai.Util.parseAkaImagePath(baseUrl, image.imageId, params);
            imageData.push(imageUrl);
        });
        return imageData;
    }

    /**
     * Takes in an instance of Viewable. Return the thumbnail url is there is a non-color 
     * thumbnail, return undefined otherwise. 
     */
    Akamai.Util.getThumbnailUrl = function(item) {
        if (item.thumbnail) {
            if (item.thumbnail.type != "Color") {
                return item.thumbnail.thumb;
            } 
        }
        return undefined;
    };

    /**
     * Takes in an instance of Viewable. Return undefined if the viewable is an instance of
     * Color, return the image url of the first image if the viewable is an instance of 
     * Gallery, return the image url of the viewable otherwise. 
     */
    Akamai.Util.getImageUrl = function(item) {
        if (item.type == "Gallery") {
            return Akamai.Util.getImageUrl(item.items[0]);
        } else if (item.type == "Color") {
            return undefined;
        } else {
            return item.image;
        }
    };

    /**
     * Takes in an instance of Viewable. Return undefined if the viewable is an instance of
     * Color, return the big url of the first image if the viewable is an instance of 
     * Gallery, return the big url of the viewable otherwise. 
     */
    Akamai.Util.getBigUrl = function(item) {
        if (item.type == "Gallery") {
            return Akamai.Util.getBigUrl(item.items[0]);
        } else if (item.type == "Color") {
            return undefined;
        } else {
            return item.big;
        }
    };

})(jQuery, window.Akamai = window.Akamai || {});