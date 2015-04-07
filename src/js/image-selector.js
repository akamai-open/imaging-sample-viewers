// Browser Detector
// will compare userAgent header for resemblance of the browser
// OR will figure out browser compatibility with the image types we support.
var OptimalImageSelector = (function($) {

    // constant browser options
    var _browsers = [{
        searchTerm: "OPR",
        name: "Opera",
        outputFormat: "PNG"
    }, {
        searchTerm: "Chrome",
        name: "Chrome",
        outputFormat: "PNG"
    }, {
        searchTerm: "MSIE",
        name: "IE",
        outputFormat: "PNG"
    }, {
        searchTerm: "Firefox",
        name: "Firefox",
        outputFormat: "PNG"
    }, {
        searchTerm: "Safari",
        name: "Safari",
        outputFormat: "PNG"
    }]

    // Data URIs to load to detect browser combatibility with 
    var _imageTypes = [{
        extension: "PNG",
        media: "png",
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAACklEQVQIW2NoAAAAggCBXSKZrwAAAABJRU5ErkJggg=="
    }, {
        extension: "GIF",
        media: "gif",
        data: "R0lGODdhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs="
    }, {
        extension: "JPEG",
        media: "jpeg",
        data: "/9j/4AAQSkZJRgABAQEAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AR//Z"
    }, {
        extension: "WEBP",
        media: "webp",
        data: "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA="
    }, {
        extension: "JXR",
        media: "vnd.ms-photo",
        data: "SUm8ASAAAAAkw91vA07+S7GFPXd2jckMAAAAAAAAAAAIAAG8AQAQAAAACAAAAAK8BAABAAAAAAAAAIC8BAABAAAAAQAAAIG8BAABAAAAAQAAAIK8CwABAAAAAADAQoO8CwABAAAAAADAQsC8BAABAAAAhgAAAMG8BAABAAAAUAAAAAAAAABXTVBIT1RPABFFwHEAAAAAcADIaerMhp6syQtMQAABAAAACAAj//8AAAEBiUAAAAAAAQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQNHIA=="
    }, {
        extension: "BMP",
        media: "bmp",
        data: "Qk2OAAAAAAAAAIoAAAB8AAAAAQAAAAEAAAABABgAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAD/AAD/AAAAAAAA/0JHUnOAwvUoYLgeFSCF6wFAMzMTgGZmJkBmZgagmZkJPArXAyRcjzIAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAA////AA=="
    }, {
        extension: "JP2",
        media: "jp2",
        data: "AAAADGpQICANCocKAAAAFGZ0eXBqcDIgAAAAAGpwMiAAAAAtanAyaAAAABZpaGRyAAAAAQAAAAEAAwcHAAAAAAAPY29scgEAAAAAABAAAACwanAyY/9P/1EALwAAAAAAAQAAAAEAAAAAAAAAAAAAAAIAAAACAAAAAAAAAAAAAwcBAQcBAQcBAf9SAAwAAAABAQAEBAAB/1wABEBA/2QAJQABQ3JlYXRlZCBieSBPcGVuSlBFRyB2ZXJzaW9uIDIuMC4w/5AACgAAAAAAOAAB/1MACQEAAAQEAAH/XQAFAUBA/1MACQIAAAQEAAH/XQAFAkBA/5PPpAgAgID/2Q=="
    }, {
        extension: "TIFF",
        media: "tiff",
        data: "SUkqAAoAAAABAA8AAAEDAAEAAAABAAAAAQEDAAEAAAABAAAAAgEDAAEAAAABAAAAAwEDAAEAAAABAAAABgEDAAEAAAABAAAACgEDAAEAAAACAAAAEQEEAAEAAAAIAAAAEgEDAAEAAAABAAAAFQEDAAEAAAABAAAAFgEDAAEAAAAAIAAAFwEEAAEAAAABAAAAHAEDAAEAAAABAAAAKQEDAAIAAAAAAAEAPgEFAAIAAAD0AAAAPwEFAAYAAADEAAAAAAAAAAAK16P/////gOF6VP////8AzcxM/////wCamZn/////gGZmJv/////wKFwP/////4AbDVD/////AFg5VP////8="
    }]

    var isRetinaDisplay = window.devicePixelRatio > 1;

    var isTouchDevice = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));


    // Initiates asynch loader to load all images
    function _createImageLoader(isEnabled, type, media, imgData) {
        var promise = $.Deferred();
        var image = new Image();
        image.onload = function() {
            promise.resolve({
                type: type.toLowerCase(),
                loaded: true
            });
        }
        image.onerror = function() {
            promise.resolve({
                type: type.toLowerCase(),
                loaded: false
            });
        }
        image.src = "data:image/" + media.toLowerCase() + ";base64," + imgData;
        return promise.promise();
    }


    function parseImageExtension(url) {
        return url.split('.').pop();
    }

    // Public Methods 
    this.getIsRetinaDisplay = function() {
        return isRetinaDisplay;
    }

    this.getIsTouchDevice = function() {
        return isTouchDevice;
    }

    // detect image support through loading data URIs
    this.detectImageSupport = function() {
        var outputFormats = _imageTypes;
        var images = [];
        var i, j;

        for (i = 0, j = outputFormats.length; i < j; i++) {
            images.push(_createImageLoader(false, outputFormats[i].extension.toLowerCase(), outputFormats[i].media, outputFormats[i].data));
        }
        return $.when.apply($, images).then(function() {
            console.log(arguments);
            return arguments;
        });
    }

    // Will retrieve the version of Safari
    this.getSafariVersion = function() {
        if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
            if ((versionIndex = navigator.userAgent.indexOf("Version")) != -1) {
                return navigator.userAgent.substring(versionIndex + 8);
            }
            var safariIndex = navigator.userAgent.indexOf("Safari");
            return navigator.userAgent.substring(safariIndex + 7);

        }
        return -1;
    }

    this.getChromeVersion = function() {
        var match = navigator.appVersion.match(/Chrome\/(\d+)\./);
        var version = parseInt(match[1], 10);
        if (!!window.chrome && !window.opera) {
            return version;
        }
        return -1;
    }

    this.isChromeMobile = function() {
        if (!!window.chrome && !window.opera) {
            var chromeIndex = navigator.userAgent.indexOf("Chrome");
            if (navigator.userAgent.substring(chromeIndex).indexOf("Mobile") > -1) {
                return true;
            } else {
                return false;
            }

        }
        return false;
    }

    this.getIEVersion = function() {
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var regex = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (regex.exec(navigator.userAgent) != null) {
                return parseFloat(RegExp.$1);
            } else {
                return -1;
            }
        }
        return -1;
    }

    // imageUrls  - array of URL strings
    // image support - arguments from detect image support
    this.getOptimizedImage = function(imagesUrls, imageSupport) {
        // parsing through the extension...maybe a better way to do this?
        var detectedFormats = {};
        //format the arguments into a object for easy read
        for (var i = 0, j = imageSupport.length; i < j; i++) {
            detectedFormats[imageSupport[i].type] = imageSupport[i].loaded;
        }

        for (var i = 0, j = imagesUrls.length; i < j; i++) {
            var format = parseImageExtension(imagesUrls[i]);

            // exception case for jpg/jpeg
            if (format.toLowerCase() === 'jpg')
                format = 'jpeg';

            // check if the format of that image exists
            if (detectedFormats[format])
                return imagesUrls[i];

        }
        return "";
        // TODO: figure out what to do when there are no formats provided supported by the browser
    }
    return this;
}(jQuery));