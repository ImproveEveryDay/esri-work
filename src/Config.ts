export const STOPS = [
    { value: 10000, size: 4, label: "<10000" },
    { value: 20000, size: 8, label: "<20000" },
    { value: 30000, size: 12, label: "<30000" },
    { value: 40000, size: 14, label: '>40000' },
];
export const VisualVariables = [
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
export const CityLayerRenderer = {
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
export const ClickedPointSymbol = {
    type: 'simple-marker',
    style: 'cross',
    size: 15,
    outline: {
        color: [0, 0, 0],
        width: 4,
    }
};
export const HighlightOptions = {
    color: [255, 255, 0],
    fillOpacity: 0.4
};

