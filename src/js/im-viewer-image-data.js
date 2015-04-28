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

(function($, ImageData) {

    ImageMetadata = function(src) {
        this.src = src;
        this.length = "Unknown";
        this.type = "Unknown";
        this.width = 0;
        this.height = 0;
    }

    ImageMetadata.prototype.getMetadata = function(callback) {
        var self = this;

        var asyncHeaderMetadata = $.ajax({
            type: "HEAD",
            url: self.src,
            success: function(data, textStatus, jqXHR) {
                if (jqXHR.status == 200) {
                    self.length = bytesToSize(parseInt(jqXHR.getResponseHeader('Content-Length')));
                    var type = jqXHR.getResponseHeader('Content-Type');
                    if (type === 'image/jpeg') {
                        self.type = 'JPEG';
                    } else if (type === 'image/png') {
                        self.type = 'PNG';
                    } else if (type === 'image/gif') {
                        self.type = 'GIF';
                    } else if (type === 'image/webp') {
                        self.type = 'WEBP';
                    } else if (type === 'image/bmp') {
                        self.type = 'BMP';
                    } else if (type === 'image/vnd.ms-photo') {
                        self.type = 'JXR';
                    } else if (type === 'image/jp2') {
                        self.type = 'JP2';
                    } else if (type === 'image/tiff') {
                        self.type = 'TIFF';
                    } else {
                        self.type = type;
                    }
                    // self.type = jqXHR.getResponseHeader('Content-Type');
                }
            }
        });

        var asyncImageSize = new $.Deferred(function(deferred) {
            $(document.createElement("img"))
                .attr("src", self.src)
                .load(function() {
                    self.width = this.width;
                    self.height = this.height;
                    deferred.resolve(this);
                })
        }).promise();

        $.when(asyncHeaderMetadata, asyncImageSize).done(function(a1, a2) {
            callback({
                length: self.length,
                type: self.type,
                width: self.width,
                height: self.height
            });
        });

        function bytesToSize(bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes == 0) return '0 Byte';
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + sizes[i];
        };
    }

    $.fn.getImageData = function(options) {
        var defaultOptions = {
            hover: true
        }
        var options = $.extend({}, defaultOptions, options);

        return this.each(function() {
            if ($(this).is("img")) {
                var image = $(this);
                var imageData = new ImageData($(this).attr("src"));
                imageData.getMetadata(function(d) {
                    data = d;
                });
            }
        });
    }

    $.fn.imageData = function(options) {

        var defaultOptions = {
            hover: true,
            metadata: ["dimensions", "size", "type"]
        }

        var options = $.extend({}, defaultOptions, options);

        function position(image, data) {
            var dataDiv = image.siblings(".im-viewer-image-data");
            if (dataDiv.length > 0) {
                dataDiv.remove();
            }
            var info = "";
            for (var i = 0; i < options.metadata.length; i++) {
                switch (options.metadata[i]) {
                    case "size":
                        info = addToImageInfo(info, data.length);
                        break;
                    case "type":
                        info = addToImageInfo(info, data.type);
                        break;
                    case "dimensions":
                        info = addToImageInfo(info, data.width + ' x ' + data.height);
                        break;
                    default:
                }
            }
            var dataSpan = $(document.createElement("span")).html(info);
            dataDiv = $(document.createElement("div")).addClass("im-viewer-image-data").html(dataSpan);
            image.after(dataDiv);
            
            setTimeout(function() {
                dataDiv.show(1 ,function() {
                    dataDiv.css("position", "absolute");
                    dataDiv.css("left", image.css("left"));
                    if (image.parent("div").css("position") == "relative") {
                        dataDiv.css("bottom", 0);
                        dataDiv.css("width", "100%");
                    } else {
                        var top = image.css("top");
                        top = parseInt(top.replace("px", ""));
                        var imageHeight = parseInt(image.css("height").replace("px", ""));
                        var dataDivHeight = dataDiv.height();
                        top = top + imageHeight - dataDivHeight;
                        dataDiv.css("top", top);
                        dataDiv.css("width", image.css("width"));
                    }
                })
            }, 0);
            return dataDiv;
        }

        function addToImageInfo(info, data) {
            if (info.length > 0) info += ", ";
            return info += data;
        }

        function hover(dataDiv) {
            if (options.hover == true) {
                dataDiv.parent().closest("div").addClass("im-viewer-hover");
            } else {
                dataDiv.css("display", "block");
            }
        }

        return this.each(function() {
            if ($(this).is("img")) {
                var image = $(this);
                var dataDiv;

                var imageData = new ImageMetadata($(this).attr("src"));
                imageData.getMetadata(function(data) {
                    hover(position(image, data));
                });
            }
        });
    };
}(jQuery, this));