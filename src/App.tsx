import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
// import ArcGISMap from "esri/Map";
// import MapView from "esri/views/MapView";
// import FeatureLayer from 'esri/layers/FeatureLayer';
import './App.css';
import { CityLayerRenderer, ClickedPointSymbol, HighlightOptions } from './Config';

const WebMapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      // lazy load the required ArcGIS API for JavaScript modules and CSS
      loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/FeatureLayer',
        'esri/Graphic',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Legend',
        'esri/widgets/Expand',
        "esri/PopupTemplate",
      ], { css: true })
        .then(([
          ArcGISMap,
          MapView,
          FeatureLayer,
          Graphic,
          GraphicsLayer,
          Legend,
          Expand,
          PopupTemplate,
        ]) => {
          let highlightCitySelect: any,
            highlightRoadSelect: any,
            cityLayerView: any,
            roadLayerView: any;

          let cityLayer = new FeatureLayer({
            //server side databsource
            url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
            definitionExpression: "class = 'city'",
            title: 'Population in US',
            renderer: CityLayerRenderer,
            popupTemplate: {
              title: "City name: {areaname}",
              content: "Population: {pop2000}",
            }
          });

          let roadLayer = new FeatureLayer({
            url: 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1',
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-line",
                color: "green",
                width: "1px"
              }
            },
            popupTemplate: {
              title: "Road name: {route}",
            },
            outFields: ['*'],
          });
          let graphicsLayer = new GraphicsLayer();
          //satellite, streets-relief-vector, light-gray-vector, dark-gray-vector, streets-navigation-vector
          const map = new ArcGISMap({
            basemap: 'streets-navigation-vector',
            layers: [cityLayer, roadLayer, graphicsLayer],
          });
          // load the map view at the ref's DOM node
          const view = new MapView({
            container: mapRef.current,
            map: map,
            center: [-118, 34],
            zoom: 6,
            highlightOptions: HighlightOptions,
            popup: {
              defaultPopupTemplateEnabled: false,
              dockEnabled: true,
              dockOptions: {
                buttonEnabled: false,
                breakpoint: false
              }
            }
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
          view.whenLayerView(roadLayer).then((layerView: any) => {
            roadLayerView = layerView;
          });

          view.on('click', (event: any) => {
            highlightCitySelect && highlightCitySelect.remove();
            highlightRoadSelect && highlightRoadSelect.remove();
            graphicsLayer.removeAll();
            view.hitTest(event)
              .then((hitTestResults: any) => {
                let roadResults = (hitTestResults.results || []).filter((result: any) => result.graphic.layer === roadLayer);
                if (roadResults.length) {//click road layer
                  let roadGraphic = roadResults[0].graphic;
                  highlightRoadSelect = roadLayerView.highlight(roadGraphic);
                  addPointMarker(event.mapPoint);
                  queryAndHightlightCities(event.mapPoint, 50, "esriSpatialRelIntersects");
                }
                else {//click city layer
                  let cityResults = (hitTestResults.results || []).filter((result: any) => result.graphic.layer === cityLayer);
                  if (cityResults.length) {
                    highlightCitySelect = cityLayerView.highlight(cityResults[0].graphic);
                  }
                }
              });

            //add a marker on the clicked point
            function addPointMarker(geometry: any) {
              let g = new Graphic({
                geometry: geometry,
                symbol: ClickedPointSymbol,
              });
              graphicsLayer.add(g);
            }
            function queryAndHightlightCities(point: any, distance: any, spatialRelationship: any) {
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
                highlightCitySelect = cityLayerView.highlight(result.features);
                //generate popup template when click the road
                const popupTemplate = new PopupTemplate({
                  title: roadLayer.popupTemplate.title,
                  content: '',
                });
                let contentStr = `<h1>There are ${result.features.length} cities in total</h1><table><tr><th>City Name</th><th>Population</th></tr>`;
                result.features.forEach((feature: any) => {
                  contentStr += `<tr><td>${feature.attributes["areaname"]}</td><td>${feature.attributes["pop2000"]}</td></tr>`;
                });
                contentStr += '</table>';
                popupTemplate.content = contentStr;
                roadLayer.popupTemplate = popupTemplate;
              });
            }
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
