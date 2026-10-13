var Main;

// Assuming you're using a bundler or ES module-compatible environment

import Map from "https://js.arcgis.com/5.1/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/5.1/@arcgis/core/Graphic.js";
import GraphicsLayer from "https://js.arcgis.com/5.1/@arcgis/core/layers/GraphicsLayer.js";
import ElevationLayer from "https://js.arcgis.com/5.1/@arcgis/core/layers/ElevationLayer.js";
import SceneView from "https://js.arcgis.com/5.1/@arcgis/core/views/SceneView.js";

Main = (function() {
    const layer = new ElevationLayer({
        url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });
    const map = new Map({
        basemap: "hybrid",
        ground: {
            layers: [layer]
         },
    });
    
    const view = new SceneView({
        container: "map",
        viewingMode: "global",
        map: map,
        camera: {
            position: {
                x: -105.503,
                y: 44.270,
                z: 20000000,
                spatialReference: {
                    wkid: 4326
    
                }
            },
            heading: 0,
            tilt: 0
        },
        popup: {
            dockEnabled: true,
            dockOptions: {
                breakpoint: false
            }
        },
        // enable shadows to be cast from the features
        environment: {
            lighting: {
                directShadowsEnabled: false
            }
        }
    });
                
    const initMap = function(){
                          
        const graphicsLayer = new GraphicsLayer();               
        map.add(graphicsLayer);

        for (const [key, value] of Object.entries(myStuff)){                       
            console.log(key, value)
                        
            const point = {                        
                type: "point",                             
                x: value.coord[0],                        
                y: value.coord[1],                            
                z: 10000                          
            };
                                
            const markerSymbol = {                            
                type: "simple-marker",                             
                color: [0, 0, 255],                            
                outline: {
                              
                    // autocasts as new SimpleLineSymbol()                              
                    color: [255, 255, 255],                             
                    width: 2
                            
                }
                          
            };
                                                
            const pointGraphic = new Graphic({                            
                geometry: point,                            
                symbol: markerSymbol,                            
                popupTemplate: {                                
                    title: key + ": " + value.city + ", " + value.state                            
                }                  
            });
                          
            graphicsLayer.add(pointGraphic);
                    
                    
        }
                                    
    }
                
    initMap()
                
    return {};

            
})();



    
