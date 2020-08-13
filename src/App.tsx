import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
// import ArcGISMap from "esri/Map";
// import MapView from "esri/views/MapView";
// import FeatureLayer from 'esri/layers/FeatureLayer';
import './App.css';
const VisualVariables = [
  {
    type: "size",
    legendOptions: {
      showLegend: true,
      title: 'population for city',
    },
    field: "pop2000",
    stops: [
      { value: 10000, size: 4, label: "<10000" },
      { value: 20000, size: 8, label: "<20000" },
      { value: 30000, size: 12, label: "<30000" },
      { value: 40000, size: 14, label: '>40000' },
    ],
  }
]
const WebMapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      // lazy load the required ArcGIS API for JavaScript modules and CSS
      loadModules(['esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
        'esri/Graphic', 'esri/layers/GraphicsLayer'], { css: true })
        .then(([ArcGISMap, MapView, FeatureLayer, Graphic, GraphicsLayer]) => {
          //satellite, streets-relief-vector, light-gray-vector, dark-gray-vector, streets-navigation-vector
          const map = new ArcGISMap({
            basemap: 'streets-navigation-vector'
          });

          let cityLayer = new FeatureLayer({
            //server side databsource
            url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
            definitionExpression: "class = 'city'",
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-marker",
                color: [226, 119, 40], // orange
                outline: {
                  color: [255, 255, 255], // white
                  width: 1
                },
              },
              visualVariables: VisualVariables,
            },
          });
          map.add(cityLayer);

          let roadLayer = new FeatureLayer({
            url: 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1',
            // url: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/ArcGIS/rest/services/Roads/FeatureServer/0',
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-line",
                color: "green",
                width: "2px"
              }
            },
          });
          map.add(roadLayer);
          var graphicsLayer = new GraphicsLayer();
          map.add(graphicsLayer);
          function addGraphics(result: any) {
            graphicsLayer.removeAll();
            result.features
              .forEach((feature: any) => {
                // const population = feature.attributes['pop2000'];
                var g = new Graphic({
                  geometry: feature.geometry,
                  attributes: feature.attributes,
                  symbol: {
                    type: "simple-marker",
                    color: [255, 255, 0],  //yellow
                    outline: {
                      width: 1,
                      color: [0, 255, 255],
                    },
                    // size: `${10 + population / 10000}px`,
                  },
                  visualVariables: VisualVariables,
                });
                graphicsLayer.add(g);
              });
          }
          function queryFeatureLayer(point: any, distance: any, spatialRelationship: any) {
            let query = {
              geometry: point,
              geometryType: 'esriGeometryEnvelope',
              units: 'kilometers',
              distance: distance,
              spatialRelationship: spatialRelationship,
              outFields: ['areaname', 'pop2000', 'class'],
              returnGeometry: true,
              // outStatistics: [],
              where: "class='city'",
            };
            cityLayer.queryFeatures(query).then(function (result: any) {
              console.log(result.features);
              addGraphics(result);
            });
          }

          // load the map view at the ref's DOM node
          const view = new MapView({
            container: mapRef.current,
            map: map,
            center: [-118, 34],
            zoom: 8
          });
          // When the view is ready, call the queryFeatureLayer function and pass in the center of the view, 1500 as the distance in meters, and intersects as the spatial relationship operator to use. This will search for and display features in the center of the map
          view.when(function () {
            const query = {
              geometry: view.center,
              units: 'kilometers',
              distance: 50,
              spatialRelationship: 'intersects',
              outFields: ['areaname', 'pop2000', 'class'],
              returnGeometry: false,
              // outStatistics: true,
            }
            // cityLayer.queryFeatures(query).then(function (result: any) {
            //   // {10 + $feature.pop2000 / 10000}
            //   const renderer = cityLayer.renderer.clone();
            //   Object.assign(renderer.symbol, {
            //     size: '30px',
            //   });
            //   cityLayer.renderer = renderer;
            // });
          });

          // view.popup.autoOpenEnabled = false;  // Disable the default popup behavior
          view.on('click', (event: any) => {
            queryFeatureLayer(event.mapPoint, 50, "esriSpatialRelIntersects");
            // view.hitTest(event)
            //   .then((hitTestResults: any) => {
            //     console.log(hitTestResults.results);
            //     if (hitTestResults.results) {
            //       // view.popup.open({ // open a popup to show some of the results
            //       //   location: event.mapPoint,
            //       //   title: "Hit Test Results",
            //       //   content: hitTestResults.results.length + "Features Found"
            //       // });
            //     }
            //   })
          })

          return () => {
            if (view) {
              // destroy the map view
              view.container = null;
            }
          };
        });
    });

  return <div className="webmap" ref={mapRef} />;
};


function App() {
  return (
    <WebMapView />
  );
}

export default App;
