import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
// import ArcGISMap from "esri/Map";
// import MapView from "esri/views/MapView";
// import FeatureLayer from 'esri/layers/FeatureLayer';
import './App.css';
const STOPS = [
  { value: 10000, size: 4, label: "<10000" },
  { value: 20000, size: 8, label: "<20000" },
  { value: 30000, size: 12, label: "<30000" },
  { value: 40000, size: 14, label: '>40000' },
];
const VisualVariables = [
  {
    type: "size",
    legendOptions: {
      showLegend: true,
      title: 'population for city',
    },
    field: "pop2000",
    stops: STOPS,
  }
];
const cityLayerRenderer = {
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
};
const highlightSymbol = {
  type: "simple-marker",
  color: [255, 255, 0],  //yellow
  outline: {
    width: 1,
    color: [0, 255, 255],
  },
};

function getSymbolSize(value: number) {
  for (let stop of STOPS) {
    if (value < stop.value) {
      return stop.size;
    }
  }
  return STOPS[STOPS.length - 1].size;
}

const WebMapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      // lazy load the required ArcGIS API for JavaScript modules and CSS
      loadModules(['esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
        'esri/Graphic', 'esri/layers/GraphicsLayer', 'esri/widgets/Legend', 'esri/widgets/Expand'], { css: true })
        .then(([ArcGISMap, MapView, FeatureLayer, Graphic, GraphicsLayer, Legend, Expand]) => {
          let highlightCities: Array<any> = [], cityLayerView: any, roadLayerView: any;

          //satellite, streets-relief-vector, light-gray-vector, dark-gray-vector, streets-navigation-vector
          const map = new ArcGISMap({
            basemap: 'streets-navigation-vector'
          });

          let cityLayer = new FeatureLayer({
            //server side databsource
            url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
            definitionExpression: "class = 'city'",
            title: 'Population in US',
            renderer: cityLayerRenderer,
            popupTemplate: {
              title: "{areaname}",
              content: "{pop2000}",
            }
          });
          map.add(cityLayer, 0);

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
            outFields: ['*'],
          });
          map.add(roadLayer, 0);

          let graphicsLayer = new GraphicsLayer();
          map.add(graphicsLayer);

          function addRoadGraphics(results: any, point: any) {
            graphicsLayer.removeAll();
            addPointMarker(point);
            results
              .forEach((result: { graphic: any }) => {
                let g = new Graphic({
                  geometry: result.graphic.geometry,
                  attributes: result.graphic.attributes,
                  // symbol: Object.assign(highlightSymbol, {
                  //   size: getSymbolSize(population),
                  // }),
                });
                graphicsLayer.add(g);
              });
          }
          function addPointMarker(geometry: any) {
            graphicsLayer.removeAll();
            let g = new Graphic({
              geometry: geometry,
              symbol: {
                type: 'simple-marker',
                style: 'cross',
                size: 15,
                outline: {
                  color: [0, 0, 0],
                  width: 4,
                }
              },
            });
            graphicsLayer.add(g);
          }
          function queryAndHightlightFeatureLayer(point: any, distance: any, spatialRelationship: any) {
            let query = {
              geometry: point,
              geometryType: 'esriGeometryEnvelope',
              units: 'kilometers',
              distance: distance,
              spatialRelationship: spatialRelationship,
              outFields: ['objectid', 'areaname', 'pop2000', 'class'],
              returnGeometry: true,
              // outStatistics: [],
              where: "class='city'",
            };
            cityLayer.queryFeatures(query).then(function (result: any) {
              // addGraphics(result);
              //highlight
              highlightCities.forEach(highlightCity => {
                if (highlightCity) {
                  highlightCity.remove();
                }
              });
              result.features.forEach((feature: any) => {
                highlightCities.push(cityLayerView.highlight(feature.attributes['objectid']))
              })
            });
          }

          // load the map view at the ref's DOM node
          const view = new MapView({
            container: mapRef.current,
            map: map,
            center: [-118, 34],
            zoom: 6,
            highlightOptions: {
              color: [255, 255, 0],
              fillOpacity: 0.4
            },
          });
          let legendExpand = new Expand({
            view: view,
            content: new Legend({
              view: view,
              layerInfos: [{
                layer: cityLayer,
                title: 'Legend',
              }]
            })
          });
          view.ui.add(legendExpand, 'top-left');

          view.whenLayerView(cityLayer).then((layerView: any) => {
            cityLayerView = layerView;
          });
          // view.whenLayerView(roadLayer).then((layerView: any) => {
          //   roadLayerView = layerView;
          //   layerView.on("click", (value: any) => {
          //   });
          // });

          view.popup.autoOpenEnabled = false;  // Disable the default popup behavior
          view.on('click', (event: any) => {
            //add symbol graphic to show the click point
            view.hitTest(event)
              .then((hitTestResults: any) => {
                let results = (hitTestResults.results || []).filter((result: any) => result.graphic.attributes.admn_class !== undefined);
                if (results.length) {
                  addRoadGraphics(results, event.mapPoint);
                  queryAndHightlightFeatureLayer(event.mapPoint, 50, "esriSpatialRelIntersects");
                }
              })
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
