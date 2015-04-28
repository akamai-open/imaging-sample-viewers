# Akamai Sample Image Viewers

This library visualizes various collections of images in a browser. A collection might represent a particular product on an e-commerce site, or a set of images related to a news article.

This library integrates directly with Images and Image Collections defined by Akamai's Image Manager. The Image Collection contains all relevant information about which images to display and how images should be organized.

The APIs can be found at: https://developer.akamai.com/api/imaging/imaging/reference.html

## Project organization
* /src - project sources
* /lib - 3rd party dependency libraries

## Install
See INSTALL for installation instructions.

## Getting Started
* Create a viewer page in HTML including Image Viewer widget. 
* Include the library and its dependencies in the HTML file. 

For example:

```html
...
    <!-- The file path will be similar to this assuming the HTML file is in root directory of this library -->
    <script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
    <script src="lib/galleria/galleria-1.4.2.min.js"></script>
    <script src="src/js/im-viewer-image-data.js"></script>
    <script src="src/js/im-viewer-image-selector.js"></script>
    <script src="src/js/im-viewer-util.js"></script>
    <script src="src/js/im-viewer-object.js"></script>
    <script src="src/js/im-viewer.js"></script>
...
```

* Include the ccs files used by the libaries:

For example: 

```html
...
    <!-- The file path will be similar to this assuming the HTML file is in root directory of this library -->
    <link rel="stylesheet" href="lib/ionicons/css/ionicons.min.css">
    <link rel="stylesheet" href="src/css/im-viewer-image-data.css">
    <link rel="stylesheet" href="src/css/im-viewer.css">
...
```

* Create an div to contain the image viewer: 

For example: 

```
...
    <div class="galleria"></div>
...
```

* Finally, instantiate the widget on the page: 

```html
...
    <script type="text/javascript">
        jQuery(document).ready(function() {
            var options = {
                baseUrl: '<base_url>',
                lunaToken: '<luna_token>',
                imageCollectionId: '<image_collection_id>',
                galleriaTheme: "<path_to_theme_file>"
            };

            $(".galleria").viewer(options);
        });
    </script>
...
```

For example:

```html
...
    <script type="text/javascript">
        jQuery(document).ready(function() {
            var options = {
                baseUrl: 'http://example.com',
                lunaToken: 'lunatoken123',
                imageCollectionId: '/sample/image/id',
                galleriaTheme: "lib/galleria/theme/classic/galleria.viewer.js",
            };

            $(".galleria").viewer(options);
        });
    </script>
...
```

## Parameters
| Parameter              | Description                                                                                                                                 | Type               | Default      | Required | 
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------ | -------- | 
| `baseUrl`              | Base URL of the domain hosting the images. Typically this is the host that Image Manager is enabled on.                                     | String             | N/A          | Yes      | 
| `lunaToken`            | 'API Token' assigned when enabling Image Manager in Luna Property Manager.                                                                  | String             | N/A          | Yes      | 
| `imageCollectionId`    | The ID of the Image Collection defined in Image Manager.                                                                                    | String             | N/A          | Yes      | 
| `galleriaTheme`        | The locatioa of the viewer theme file `galleria.viewer.js` in the directory `lib/galleria/themes/classic`.                                  | String             | N/A          | Yes      | 
| `windowWidthThreshold` | The window width threshold used to choose between viewerWidth/viewerHeight and smViewerWidth/smViewerHeight.                                | px                 | "600px"      | No       | 
| `viewerWidth`          | Width of the viewer when the width of the browser window width is larger than the 'windowWidthThreshold'.                                   | px or %            | "100%"       | No       | 
| `viewerHeight`         | Height of the viewer when the width of the browser window width is larger than the 'windowWidthThreshold'.                                  | px or %            | "100%"       | No       | 
| `smViewerWidth`        | Width of the viewer when the width of the browser window width is smaller than the 'windowWidthThreshold'.                                  | px or %            | "100%"       | No       | 
| `smViewerHeight`       | Height of the viewer when the width of the browser window width is smaller than the 'windowWidthThreshold'.                                 | px or %            | "100%"       | No       | 
| `thumbnailWidth`       | Akamai query value for the thumbnail image width, used when requesting the thumbnail image from Akamai.                                     | px or %            | "50px"       | No       | 
| `galleryContainer`     | CSS selector for the div element that contains the swatches. The viewer will create the div if jQuery cannot find the element specified.    | String             | "#galleries" | No       | 
| `rotationInverse`      | If true, the frames for the Rotatable images will be inversed.                                                                              | Boolean            | false        | No       | 
| `hoverFocus`           | If ture, the viewer will display the image when mouse hover over its thumbnail.                                                             | Boolean            | false        | No       | 
| `showImageData`        | If ture, the the image data will always be displayed, if "hover", is will only be visible when hovered over, if false, it is not displayed. | Boolean or "hover" | false        | No       | 
| `dummyImage`           | The path to a dummy image to display if the viewer cannot fetch the image.                                                                  | String             | N/A          | No       | 


## Magnifier
The Akamai Sample Image Viewer has a built in magnifier. 
Please use instructions in MAGNIFIER_README to enable and initialize the magnifier.
