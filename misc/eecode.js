{"dependencies":{"users/jetolan-meta/forestmonitoring:canopyheight":"/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #23cba7 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var canopyHeight = ee.ImageCollection('projects/meta-forest-monitoring-okw37/assets/CanopyHeight').mosaic();
var treenotree = canopyHeight.updateMask(canopyHeight.gte(1))

//// viz settings //// 
var palettes=require('users/gena/packages:palettes');

///Other teams layers///
var ethcanopyheight = ee.Image('users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1')
Map.addLayer(ethcanopyheight, {min: 0, max: 25, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height Lang 2022 98%', false)

var umdheight = ee.ImageCollection(\"users/potapovpeter/GEDI_V27\").mosaic()
Map.addLayer(umdheight, {min: 0, max: 25, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height Potapov 2021 95%', false)

///Our layers///
Map.addLayer(treenotree, {min: 0, max: 1, palette: ['440154', 'fde725']}, 'Canopy height (>=1 meter)', false);
Map.addLayer(canopyHeight, {min: 0, max: 25, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height [meters]');


///Default location and zoom///
Map.setCenter(0,10,3)


//////////

//// style templates ////
var borderStyle = '3px double green';
var optionsTitleStyle = {fontSize: '18px', fontWeight: 'bold', textAlign: 'center', color: 'green'};

//////// All Labels //////
var AllLabels = { 
  title: ['Global Canopy Height'],
  intro: [
    'Tolan et al. (2023). \"Sub-meter resolution canopy height maps using self-supervised learning and a vision transformer trained on Aerial and GEDI Lidar\"'],
  clause: ['Data may be shifted relative to basemap imagery due to differences in imagery observation date and/or orthorectification.'],
  clause2:['For this visualization, we use mean downsampling of roughly 1m pixels, which may lead to some of the height difference with previously published datasets (Lang, Potapov), which are mean downsamples of 95th and 98th percentile 10m and 30m pixels.'],
  resetbuttonLabel: ['Reset Map'],
  PITitle: ['Point Inspector'],
  PIInstr:[\"Select points to identify  canopy height.\"],
  pointlayername: [\"Custom Point\"],
  aoiTitle: ['AOI Inspector'],
  aoiInstr:[\"Create a region of interest and calculate mean canopy height\"],
  aoilayername: [\"Custom Point\"],
} ;


//////Colorbar//////

var nSteps = 9
// Creates a color bar thumbnail image for use in legend from the given color palette
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, nSteps, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: nSteps,
    palette: palette,
  };
}

// Create a panel with three numbers for the legend
var legendLabels = ui.Panel({
  widgets: [
    //ui.Label(\"0\", {margin: '4px 8px'}),
    ui.Label(\"0 3 6 9 12 15 18 21 24\", { textAlign: 'center', stretch: 'horizontal', margin: '0px 0px'}),
    //ui.Label(
    //    ((palettes.matplotlib.viridis[7].max-palettes.matplotlib.viridis[7].min) / 2+palettes.matplotlib.viridis[7].min),
   //     {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
    //ui.Label(\"20\", {margin: '4px 8px', textAlign: 'right'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});


// Create the colour bar for the legend
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0).int(),
  params: makeColorBarParams(palettes.matplotlib.viridis[7]),
  style: {stretch: 'horizontal', margin: '8px 30px', maxHeight: '24px'},
});


////------------------------------------------Panel for intro (AllPanels index 1)------------------------------------------------ ////

var IntroPanel = ui.Panel({style: {width: '200px'}})
    .add(ui.Label({
      value: AllLabels.title[0], 
      style: {fontWeight: 'bold', fontSize: '18px', margin: '10px 5px'}
    }))
    .add(ui.Label({
      value: AllLabels.intro[0]
    }))
    .add(ui.Label({
      value: AllLabels.clause[0]
    }))
    .add(ui.Label({
      value: AllLabels.clause2[0]
    }))
    .add(colorBar).add(legendLabels);

////------------------------------------------Panel for point inspector (AllPanels index 2)------------------------------------------------ ////
//// Create panel to hold point inspector & lon/lat + ch values.////
var lon = ui.Label();
var lat = ui.Label();
var ch = ui.Label();

var coordPanel = ui.Panel({
  widgets: [lon, lat, ch],
  layout: ui.Panel.Layout.flow('vertical'),
});

////checkbox to turn the point change inspector on and off ////
var PI_OnOff = ui.Checkbox({
  label: \"Turn On\",
  style: {color: 'green'},
  onChange: function(){ 
    if (PI_OnOff.getValue()===true){ //If checkbox is checked, a chart is created after clicking the map
        Map.style().set('cursor', 'crosshair');
        Map.onClick(function(coords) {
        //// Update the lon/lat panel with values from the click event. ////
        lon.setValue('Lon: ' + coords.lon.toFixed(5));
        lat.setValue('Lat: ' + coords.lat.toFixed(5));
        
        //// Add a layer with a dot for the point clicked on. A new layer is added each time. ////
        var point = ee.FeatureCollection(ee.Geometry.Point(coords.lon, coords.lat));
        var pointlayername = AllLabels.pointlayername[0];
        //// extract CH at the point using reducer
        var chLabel = canopyHeight.reduceRegion({
              reducer: ee.Reducer.mean(),
              geometry: point,
              scale: 1.2
            }).get('cover_code')
        chLabel.evaluate(showCH);
        function showCH(chLabel) {
            ch.setValue('Canopy height: ' + chLabel);
        }
        Map.addLayer(point.draw({color: '#6F20A8', pointRadius: 5}), {}, pointlayername + ': ' + coords.lon.toFixed(5) + ', ' + coords.lat.toFixed(5));
        }

      )}
    else{ //if checkbox is not checked, clicks on the map are not listed for and the cursor is styled back to the default hand
      Map.unlisten(); 
      Map.style().set('cursor', 'hand');
    }
    },
});

////------------------------------------------Panel for aoi inspector (AllPanels index 3)------------------------------------------------ ////
//// Create panel to hold aoi inspector for ch values.////
var avg = ui.Label();

var avgPanel = ui.Panel({
  widgets: [avg],
  layout: ui.Panel.Layout.flow('horizontal'),
});

var sum = ui.Label();

var sumPanel = ui.Panel({
  widgets: [sum],
  layout: ui.Panel.Layout.flow('horizontal'),
});


///////// set up ability to draw their own polygon/////
var drawingTools = Map.drawingTools();
drawingTools.setShown(false);
while (drawingTools.layers().length() > 0) {
  var layer = drawingTools.layers().get(0);
  drawingTools.layers().remove(layer);
}

var dummyGeometry =
    ui.Map.GeometryLayer({geometries: null, name: 'geometry', color: '23cba7'});

drawingTools.layers().add(dummyGeometry);

function clearGeometry() {
  var layers = drawingTools.layers();
  layers.get(0).geometries().remove(layers.get(0).geometries().get(0));
}

// function drawRectangle() {
//   clearGeometry();
//   drawingTools.setShape('rectangle');
//   drawingTools.draw();
// }

function drawPolygon() {
  clearGeometry();
  drawingTools.setShape('polygon');
  drawingTools.draw();
}

var chartPanel = ui.Panel({
  style:
      {height: '235px', width: '300px', position: 'bottom-right', shown: false}
});

//Map.add(chartPanel);

function histogramOfCH() {
  // Make the chart panel visible the first time a geometry is drawn.
  if (!chartPanel.style().get('shown')) {
    chartPanel.style().set('shown', true);
  }
  
  Map.add(chartPanel);
  
  // Get the drawn geometry; it will define the reduction region.
  var aoi = drawingTools.layers().get(0).getEeObject();

  // Set the drawing mode back to null; turns drawing off.
  drawingTools.setShape(null);

  
  //Pixel - Area conversion
  var areacanopyHeight = canopyHeight.multiply(ee.Image.pixelArea())
  var areacanopyBinary = treenotree.multiply(ee.Image.pixelArea())
  
  // Chart histogram of height for the selected area of interest.
  var chart = ui.Chart.image
                  .histogram({
                    image: areacanopyHeight,
                    region: aoi,
                    scale: 1.2,
                    minBucketWidth: 2,
                  })
                  .setOptions({
                    titlePostion: 'none',
                    legend: {position: 'none'},
                    hAxis: {title: 'Height (m)'},
                    vAxis: {title: 'Area (m^2)'},
                    series: {0: {color: '23cba7'}}
                  });

  // Replace the existing chart in the chart panel with the new chart.
  chartPanel.widgets().reset([chart]);
  
  
  var chLabel = areacanopyHeight.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: aoi,
  scale: 1.2,
  crs: 'EPSG:3857',
  }).get('cover_code')
  
  chLabel.evaluate(showCH);
  //print(chLabel)
  //print(ee.Number(chLabel));
  function showCH(chLabel) {
  avg.setValue('Avg height: ' + chLabel.toFixed(2)+ ' m');
  }


  var chSum = areacanopyBinary.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 1.2,
  crs: 'EPSG:3857',
  }).get('cover_code')
  chSum.evaluate(showCHSum);
  function showCHSum(chSum) {
  sum.setValue('Area >=1m: ' + chSum.toFixed(2)+ ' m^2');
  }

}

drawingTools.onDraw(ui.util.debounce(histogramOfCH, 500));
drawingTools.onEdit(ui.util.debounce(histogramOfCH, 500));


////checkbox to turn the point change inspector on and off ////
var aoi_OnOff = ui.Checkbox({
  label: \"Turn On\",
  style: {color: 'green'},
  onChange: function(){ 
    if (aoi_OnOff.getValue()===true){ //If checkbox is checked, a chart is created after clicking the map
        // Allow the user to draw a polygon
        drawPolygon();
    }
    else{ //if checkbox is not checked, clicks on the map are not listed for and the cursor is styled back to the default hand
      Map.unlisten(); 
      Map.style().set('cursor', 'hand');
    }
    },
});


////------------------------------------------Panel for reset button (AllPanels index 4)----------------------------------------- ////
var resetbutton = ui.Button({
    label: AllLabels.resetbuttonLabel[0], 
    style: {width: '200px', color: '#EB7B59', padding: '5px 5px 15px 5px',},
    onClick: function reset(){
      Map.layers().reset();
      clearGeometry();
      Map.addLayer(ethcanopyheight, {min: 0, max: 25, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height Lang 2022 98%', false);
      Map.addLayer(umdheight, {min: 0, max: 25, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height Potapov 2021 95%', false);
      Map.addLayer(treenotree, {min: 0, max: 1, palette: ['440154', 'fde725']}, 'Canopy height (>=1 meter)', false);
      Map.addLayer(canopyHeight, {min: 0, max: 20, palette: palettes.matplotlib.viridis[7]}, 'Canopy Height [m]');
      Map.remove(chartPanel);
      //chartPanel.reset();
      mapinfopanel.clear();
      mapinfopanel.style().set({width: '0px'});
    }
  });


////final panel that holds the reset button
/// add export or something else here if you want!!!! 
var resetPanel = ui.Panel({
  widgets: [
    resetbutton,
    ]
});


////////////////////////////////////////////
//// POINT INSPECTOR PANEL ////
////////////////////////////////////////////
var PIPanel = ui.Panel({
  widgets: [
  /*0*/ui.Label({
    value: AllLabels.PITitle[0],
    style: optionsTitleStyle,
  }),
  /*1*/ui.Label(AllLabels.PIInstr[0]),
  /*2*/PI_OnOff,
  /*3*/coordPanel,
  ],
  style: {margin: '10px 0px 0px 0px', border: borderStyle}
});

//////////////////////////////////////////
// AOI INSPECTOR PANEL ////
//////////////////////////////////////////
var aoiPanel = ui.Panel({
  widgets: [
  /*0*/ui.Label({
    value: AllLabels.aoiTitle[0],
    style: optionsTitleStyle,
  }),
  /*1*/ui.Label(AllLabels.aoiInstr[0]),
  /*2*/aoi_OnOff,
  /*3*/avgPanel,
  /*4*/sumPanel,
  ],
  style: {margin: '10px 0px 0px 0px', border: borderStyle}
});

var AllPanels = ui.Panel({
  widgets: [
    /*0*/ IntroPanel,
    /*1*/ PIPanel, 
    /*2*/ aoiPanel,
    /*3*/ resetPanel,
    // /*4*/ ExportPanel, 
    ],
  style: {width: '250px', padding: '8px'}
});

//insert this panel into the root panel (sidebar)
//ui.root.insert(0,AllPanels);
ui.root.add(AllPanels);
//--------------------------------------------------------------map info panel-----------------------------------//
////empty panel called mapinfopanel placed in the bottom left of the map. 

var mapinfopanel = ui.Panel({
  style: {position: 'top-left'}
});

Map.add(mapinfopanel);
","users/gena/packages:palettes":"/*
Copyright (c) 2018 Gennadii Donchyts. All rights reserved.

This work is licensed under the terms of the MIT license.  
For a copy, see <https://opensource.org/licenses/MIT>.

Contributors:

* 2018-08-01: Fedor Baart (f.baart@gmail.com) - added cmocean
* 2019-01-18: Justin Braaten (jstnbraaten@gmail.com) - added niccoli, matplotlib, kovesi, misc
* 2019-11-14: Gennadii Donchyts (gennadii.donchyts@gmail.com) - added crameri

GitHub repository with a user guide: https://github.com/gee-community/ee-palettes

*/

exports.cmocean = {
  Thermal: {7: ['042333', '2c3395', '744992', 'b15f82', 'eb7958', 'fbb43d', 'e8fa5b']},
  Haline: {7: ['2a186c', '14439c', '206e8b', '3c9387', '5ab978', 'aad85c', 'fdef9a']},
  Solar: {7: ['331418', '682325', '973b1c', 'b66413', 'cb921a', 'dac62f', 'e1fd4b']},
  Ice: {7: ['040613', '292851', '3f4b96', '427bb7', '61a8c7', '9cd4da', 'eafdfd']},
  Gray: {7: ['000000', '232323', '4a4a49', '727171', '9b9a9a', 'cacac9', 'fffffd']}, 
  Oxy: {7: ['400505', '850a0b', '6f6f6e', '9b9a9a', 'cbcac9', 'ebf34b', 'ddaf19']},
  Deep: {7: ['fdfecc', 'a5dfa7', '5dbaa4', '488e9e', '3e6495', '3f396c', '281a2c']},
  Dense: {7: ['e6f1f1', 'a2cee2', '76a4e5', '7871d5', '7642a5', '621d62', '360e24']},
  Algae: {7: ['d7f9d0', 'a2d595', '64b463', '129450', '126e45', '1a482f', '122414']},
  Matter: {7: ['feedb0', 'f7b37c', 'eb7858', 'ce4356', '9f2462', '66185c', '2f0f3e']},
  Turbid: {7: ['e9f6ab', 'd3c671', 'bf9747', 'a1703b', '795338', '4d392d', '221f1b']},
  Speed: {7: ['fffdcd', 'e1cd73', 'aaac20', '5f920c', '187328', '144b2a', '172313']},
  Amp: {7: ['f1edec', 'dfbcb0', 'd08b73', 'c0583b', 'a62225', '730e27', '3c0912']},
  Tempo: {7: ['fff6f4', 'c3d1ba', '7db390', '2a937f', '156d73', '1c455b', '151d44']},
  Phase: {7: ['a8780d', 'd74957', 'd02fd0', '7d73f0', '1e93a8', '359943', 'a8780d']},
  Balance: {7: ['181c43', '0c5ebe', '75aabe', 'f1eceb', 'd08b73','a52125', '3c0912']},
  Delta: {7: ['112040', '1c67a0', '6db6b3', 'fffccc', 'abac21', '177228', '172313']},
  Curl: {7: ['151d44', '156c72', '7eb390', 'fdf5f4', 'db8d77', '9c3060', '340d35']}
}
  
exports.colorbrewer = {
  YlGn:{3:[\"f7fcb9\",\"addd8e\",\"31a354\"],4:[\"ffffcc\",\"c2e699\",\"78c679\",\"238443\"],5:[\"ffffcc\",\"c2e699\",\"78c679\",\"31a354\",\"006837\"],6:[\"ffffcc\",\"d9f0a3\",\"addd8e\",\"78c679\",\"31a354\",\"006837\"],7:[\"ffffcc\",\"d9f0a3\",\"addd8e\",\"78c679\",\"41ab5d\",\"238443\",\"005a32\"],8:[\"ffffe5\",\"f7fcb9\",\"d9f0a3\",\"addd8e\",\"78c679\",\"41ab5d\",\"238443\",\"005a32\"],9:[\"ffffe5\",\"f7fcb9\",\"d9f0a3\",\"addd8e\",\"78c679\",\"41ab5d\",\"238443\",\"006837\",\"004529\"]},
  YlGnBu:{3:[\"edf8b1\",\"7fcdbb\",\"2c7fb8\"],4:[\"ffffcc\",\"a1dab4\",\"41b6c4\",\"225ea8\"],5:[\"ffffcc\",\"a1dab4\",\"41b6c4\",\"2c7fb8\",\"253494\"],6:[\"ffffcc\",\"c7e9b4\",\"7fcdbb\",\"41b6c4\",\"2c7fb8\",\"253494\"],7:[\"ffffcc\",\"c7e9b4\",\"7fcdbb\",\"41b6c4\",\"1d91c0\",\"225ea8\",\"0c2c84\"],8:[\"ffffd9\",\"edf8b1\",\"c7e9b4\",\"7fcdbb\",\"41b6c4\",\"1d91c0\",\"225ea8\",\"0c2c84\"],9:[\"ffffd9\",\"edf8b1\",\"c7e9b4\",\"7fcdbb\",\"41b6c4\",\"1d91c0\",\"225ea8\",\"253494\",\"081d58\"]},
  GnBu:{3:[\"e0f3db\",\"a8ddb5\",\"43a2ca\"],4:[\"f0f9e8\",\"bae4bc\",\"7bccc4\",\"2b8cbe\"],5:[\"f0f9e8\",\"bae4bc\",\"7bccc4\",\"43a2ca\",\"0868ac\"],6:[\"f0f9e8\",\"ccebc5\",\"a8ddb5\",\"7bccc4\",\"43a2ca\",\"0868ac\"],7:[\"f0f9e8\",\"ccebc5\",\"a8ddb5\",\"7bccc4\",\"4eb3d3\",\"2b8cbe\",\"08589e\"],8:[\"f7fcf0\",\"e0f3db\",\"ccebc5\",\"a8ddb5\",\"7bccc4\",\"4eb3d3\",\"2b8cbe\",\"08589e\"],9:[\"f7fcf0\",\"e0f3db\",\"ccebc5\",\"a8ddb5\",\"7bccc4\",\"4eb3d3\",\"2b8cbe\",\"0868ac\",\"084081\"]},
  BuGn:{3:[\"e5f5f9\",\"99d8c9\",\"2ca25f\"],4:[\"edf8fb\",\"b2e2e2\",\"66c2a4\",\"238b45\"],5:[\"edf8fb\",\"b2e2e2\",\"66c2a4\",\"2ca25f\",\"006d2c\"],6:[\"edf8fb\",\"ccece6\",\"99d8c9\",\"66c2a4\",\"2ca25f\",\"006d2c\"],7:[\"edf8fb\",\"ccece6\",\"99d8c9\",\"66c2a4\",\"41ae76\",\"238b45\",\"005824\"],8:[\"f7fcfd\",\"e5f5f9\",\"ccece6\",\"99d8c9\",\"66c2a4\",\"41ae76\",\"238b45\",\"005824\"],9:[\"f7fcfd\",\"e5f5f9\",\"ccece6\",\"99d8c9\",\"66c2a4\",\"41ae76\",\"238b45\",\"006d2c\",\"00441b\"]},
  PuBuGn:{3:[\"ece2f0\",\"a6bddb\",\"1c9099\"],4:[\"f6eff7\",\"bdc9e1\",\"67a9cf\",\"02818a\"],5:[\"f6eff7\",\"bdc9e1\",\"67a9cf\",\"1c9099\",\"016c59\"],6:[\"f6eff7\",\"d0d1e6\",\"a6bddb\",\"67a9cf\",\"1c9099\",\"016c59\"],7:[\"f6eff7\",\"d0d1e6\",\"a6bddb\",\"67a9cf\",\"3690c0\",\"02818a\",\"016450\"],8:[\"fff7fb\",\"ece2f0\",\"d0d1e6\",\"a6bddb\",\"67a9cf\",\"3690c0\",\"02818a\",\"016450\"],9:[\"fff7fb\",\"ece2f0\",\"d0d1e6\",\"a6bddb\",\"67a9cf\",\"3690c0\",\"02818a\",\"016c59\",\"014636\"]},
  PuBu:{3:[\"ece7f2\",\"a6bddb\",\"2b8cbe\"],4:[\"f1eef6\",\"bdc9e1\",\"74a9cf\",\"0570b0\"],5:[\"f1eef6\",\"bdc9e1\",\"74a9cf\",\"2b8cbe\",\"045a8d\"],6:[\"f1eef6\",\"d0d1e6\",\"a6bddb\",\"74a9cf\",\"2b8cbe\",\"045a8d\"],7:[\"f1eef6\",\"d0d1e6\",\"a6bddb\",\"74a9cf\",\"3690c0\",\"0570b0\",\"034e7b\"],8:[\"fff7fb\",\"ece7f2\",\"d0d1e6\",\"a6bddb\",\"74a9cf\",\"3690c0\",\"0570b0\",\"034e7b\"],9:[\"fff7fb\",\"ece7f2\",\"d0d1e6\",\"a6bddb\",\"74a9cf\",\"3690c0\",\"0570b0\",\"045a8d\",\"023858\"]},
  BuPu:{3:[\"e0ecf4\",\"9ebcda\",\"8856a7\"],4:[\"edf8fb\",\"b3cde3\",\"8c96c6\",\"88419d\"],5:[\"edf8fb\",\"b3cde3\",\"8c96c6\",\"8856a7\",\"810f7c\"],6:[\"edf8fb\",\"bfd3e6\",\"9ebcda\",\"8c96c6\",\"8856a7\",\"810f7c\"],7:[\"edf8fb\",\"bfd3e6\",\"9ebcda\",\"8c96c6\",\"8c6bb1\",\"88419d\",\"6e016b\"],8:[\"f7fcfd\",\"e0ecf4\",\"bfd3e6\",\"9ebcda\",\"8c96c6\",\"8c6bb1\",\"88419d\",\"6e016b\"],9:[\"f7fcfd\",\"e0ecf4\",\"bfd3e6\",\"9ebcda\",\"8c96c6\",\"8c6bb1\",\"88419d\",\"810f7c\",\"4d004b\"]},
  RdPu:{3:[\"fde0dd\",\"fa9fb5\",\"c51b8a\"],4:[\"feebe2\",\"fbb4b9\",\"f768a1\",\"ae017e\"],5:[\"feebe2\",\"fbb4b9\",\"f768a1\",\"c51b8a\",\"7a0177\"],6:[\"feebe2\",\"fcc5c0\",\"fa9fb5\",\"f768a1\",\"c51b8a\",\"7a0177\"],7:[\"feebe2\",\"fcc5c0\",\"fa9fb5\",\"f768a1\",\"dd3497\",\"ae017e\",\"7a0177\"],8:[\"fff7f3\",\"fde0dd\",\"fcc5c0\",\"fa9fb5\",\"f768a1\",\"dd3497\",\"ae017e\",\"7a0177\"],9:[\"fff7f3\",\"fde0dd\",\"fcc5c0\",\"fa9fb5\",\"f768a1\",\"dd3497\",\"ae017e\",\"7a0177\",\"49006a\"]},
  PuRd:{3:[\"e7e1ef\",\"c994c7\",\"dd1c77\"],4:[\"f1eef6\",\"d7b5d8\",\"df65b0\",\"ce1256\"],5:[\"f1eef6\",\"d7b5d8\",\"df65b0\",\"dd1c77\",\"980043\"],6:[\"f1eef6\",\"d4b9da\",\"c994c7\",\"df65b0\",\"dd1c77\",\"980043\"],7:[\"f1eef6\",\"d4b9da\",\"c994c7\",\"df65b0\",\"e7298a\",\"ce1256\",\"91003f\"],8:[\"f7f4f9\",\"e7e1ef\",\"d4b9da\",\"c994c7\",\"df65b0\",\"e7298a\",\"ce1256\",\"91003f\"],9:[\"f7f4f9\",\"e7e1ef\",\"d4b9da\",\"c994c7\",\"df65b0\",\"e7298a\",\"ce1256\",\"980043\",\"67001f\"]},
  OrRd:{3:[\"fee8c8\",\"fdbb84\",\"e34a33\"],4:[\"fef0d9\",\"fdcc8a\",\"fc8d59\",\"d7301f\"],5:[\"fef0d9\",\"fdcc8a\",\"fc8d59\",\"e34a33\",\"b30000\"],6:[\"fef0d9\",\"fdd49e\",\"fdbb84\",\"fc8d59\",\"e34a33\",\"b30000\"],7:[\"fef0d9\",\"fdd49e\",\"fdbb84\",\"fc8d59\",\"ef6548\",\"d7301f\",\"990000\"],8:[\"fff7ec\",\"fee8c8\",\"fdd49e\",\"fdbb84\",\"fc8d59\",\"ef6548\",\"d7301f\",\"990000\"],9:[\"fff7ec\",\"fee8c8\",\"fdd49e\",\"fdbb84\",\"fc8d59\",\"ef6548\",\"d7301f\",\"b30000\",\"7f0000\"]},
  YlOrRd:{3:[\"ffeda0\",\"feb24c\",\"f03b20\"],4:[\"ffffb2\",\"fecc5c\",\"fd8d3c\",\"e31a1c\"],5:[\"ffffb2\",\"fecc5c\",\"fd8d3c\",\"f03b20\",\"bd0026\"],6:[\"ffffb2\",\"fed976\",\"feb24c\",\"fd8d3c\",\"f03b20\",\"bd0026\"],7:[\"ffffb2\",\"fed976\",\"feb24c\",\"fd8d3c\",\"fc4e2a\",\"e31a1c\",\"b10026\"],8:[\"ffffcc\",\"ffeda0\",\"fed976\",\"feb24c\",\"fd8d3c\",\"fc4e2a\",\"e31a1c\",\"b10026\"],9:[\"ffffcc\",\"ffeda0\",\"fed976\",\"feb24c\",\"fd8d3c\",\"fc4e2a\",\"e31a1c\",\"bd0026\",\"800026\"]},
  YlOrBr:{3:[\"fff7bc\",\"fec44f\",\"d95f0e\"],4:[\"ffffd4\",\"fed98e\",\"fe9929\",\"cc4c02\"],5:[\"ffffd4\",\"fed98e\",\"fe9929\",\"d95f0e\",\"993404\"],6:[\"ffffd4\",\"fee391\",\"fec44f\",\"fe9929\",\"d95f0e\",\"993404\"],7:[\"ffffd4\",\"fee391\",\"fec44f\",\"fe9929\",\"ec7014\",\"cc4c02\",\"8c2d04\"],8:[\"ffffe5\",\"fff7bc\",\"fee391\",\"fec44f\",\"fe9929\",\"ec7014\",\"cc4c02\",\"8c2d04\"],9:[\"ffffe5\",\"fff7bc\",\"fee391\",\"fec44f\",\"fe9929\",\"ec7014\",\"cc4c02\",\"993404\",\"662506\"]},
  Purples:{3:[\"efedf5\",\"bcbddc\",\"756bb1\"],4:[\"f2f0f7\",\"cbc9e2\",\"9e9ac8\",\"6a51a3\"],5:[\"f2f0f7\",\"cbc9e2\",\"9e9ac8\",\"756bb1\",\"54278f\"],6:[\"f2f0f7\",\"dadaeb\",\"bcbddc\",\"9e9ac8\",\"756bb1\",\"54278f\"],7:[\"f2f0f7\",\"dadaeb\",\"bcbddc\",\"9e9ac8\",\"807dba\",\"6a51a3\",\"4a1486\"],8:[\"fcfbfd\",\"efedf5\",\"dadaeb\",\"bcbddc\",\"9e9ac8\",\"807dba\",\"6a51a3\",\"4a1486\"],9:[\"fcfbfd\",\"efedf5\",\"dadaeb\",\"bcbddc\",\"9e9ac8\",\"807dba\",\"6a51a3\",\"54278f\",\"3f007d\"]},
  Blues:{3:[\"deebf7\",\"9ecae1\",\"3182bd\"],4:[\"eff3ff\",\"bdd7e7\",\"6baed6\",\"2171b5\"],5:[\"eff3ff\",\"bdd7e7\",\"6baed6\",\"3182bd\",\"08519c\"],6:[\"eff3ff\",\"c6dbef\",\"9ecae1\",\"6baed6\",\"3182bd\",\"08519c\"],7:[\"eff3ff\",\"c6dbef\",\"9ecae1\",\"6baed6\",\"4292c6\",\"2171b5\",\"084594\"],8:[\"f7fbff\",\"deebf7\",\"c6dbef\",\"9ecae1\",\"6baed6\",\"4292c6\",\"2171b5\",\"084594\"],9:[\"f7fbff\",\"deebf7\",\"c6dbef\",\"9ecae1\",\"6baed6\",\"4292c6\",\"2171b5\",\"08519c\",\"08306b\"]},
  Greens:{3:[\"e5f5e0\",\"a1d99b\",\"31a354\"],4:[\"edf8e9\",\"bae4b3\",\"74c476\",\"238b45\"],5:[\"edf8e9\",\"bae4b3\",\"74c476\",\"31a354\",\"006d2c\"],6:[\"edf8e9\",\"c7e9c0\",\"a1d99b\",\"74c476\",\"31a354\",\"006d2c\"],7:[\"edf8e9\",\"c7e9c0\",\"a1d99b\",\"74c476\",\"41ab5d\",\"238b45\",\"005a32\"],8:[\"f7fcf5\",\"e5f5e0\",\"c7e9c0\",\"a1d99b\",\"74c476\",\"41ab5d\",\"238b45\",\"005a32\"],9:[\"f7fcf5\",\"e5f5e0\",\"c7e9c0\",\"a1d99b\",\"74c476\",\"41ab5d\",\"238b45\",\"006d2c\",\"00441b\"]},
  Oranges:{3:[\"fee6ce\",\"fdae6b\",\"e6550d\"],4:[\"feedde\",\"fdbe85\",\"fd8d3c\",\"d94701\"],5:[\"feedde\",\"fdbe85\",\"fd8d3c\",\"e6550d\",\"a63603\"],6:[\"feedde\",\"fdd0a2\",\"fdae6b\",\"fd8d3c\",\"e6550d\",\"a63603\"],7:[\"feedde\",\"fdd0a2\",\"fdae6b\",\"fd8d3c\",\"f16913\",\"d94801\",\"8c2d04\"],8:[\"fff5eb\",\"fee6ce\",\"fdd0a2\",\"fdae6b\",\"fd8d3c\",\"f16913\",\"d94801\",\"8c2d04\"],9:[\"fff5eb\",\"fee6ce\",\"fdd0a2\",\"fdae6b\",\"fd8d3c\",\"f16913\",\"d94801\",\"a63603\",\"7f2704\"]},
  Reds:{3:[\"fee0d2\",\"fc9272\",\"de2d26\"],4:[\"fee5d9\",\"fcae91\",\"fb6a4a\",\"cb181d\"],5:[\"fee5d9\",\"fcae91\",\"fb6a4a\",\"de2d26\",\"a50f15\"],6:[\"fee5d9\",\"fcbba1\",\"fc9272\",\"fb6a4a\",\"de2d26\",\"a50f15\"],7:[\"fee5d9\",\"fcbba1\",\"fc9272\",\"fb6a4a\",\"ef3b2c\",\"cb181d\",\"99000d\"],8:[\"fff5f0\",\"fee0d2\",\"fcbba1\",\"fc9272\",\"fb6a4a\",\"ef3b2c\",\"cb181d\",\"99000d\"],9:[\"fff5f0\",\"fee0d2\",\"fcbba1\",\"fc9272\",\"fb6a4a\",\"ef3b2c\",\"cb181d\",\"a50f15\",\"67000d\"]},
  Greys:{3:[\"f0f0f0\",\"bdbdbd\",\"636363\"],4:[\"f7f7f7\",\"cccccc\",\"969696\",\"525252\"],5:[\"f7f7f7\",\"cccccc\",\"969696\",\"636363\",\"252525\"],6:[\"f7f7f7\",\"d9d9d9\",\"bdbdbd\",\"969696\",\"636363\",\"252525\"],7:[\"f7f7f7\",\"d9d9d9\",\"bdbdbd\",\"969696\",\"737373\",\"525252\",\"252525\"],8:[\"ffffff\",\"f0f0f0\",\"d9d9d9\",\"bdbdbd\",\"969696\",\"737373\",\"525252\",\"252525\"],9:[\"ffffff\",\"f0f0f0\",\"d9d9d9\",\"bdbdbd\",\"969696\",\"737373\",\"525252\",\"252525\",\"000000\"]},
  PuOr:{3:[\"f1a340\",\"f7f7f7\",\"998ec3\"],4:[\"e66101\",\"fdb863\",\"b2abd2\",\"5e3c99\"],5:[\"e66101\",\"fdb863\",\"f7f7f7\",\"b2abd2\",\"5e3c99\"],6:[\"b35806\",\"f1a340\",\"fee0b6\",\"d8daeb\",\"998ec3\",\"542788\"],7:[\"b35806\",\"f1a340\",\"fee0b6\",\"f7f7f7\",\"d8daeb\",\"998ec3\",\"542788\"],8:[\"b35806\",\"e08214\",\"fdb863\",\"fee0b6\",\"d8daeb\",\"b2abd2\",\"8073ac\",\"542788\"],9:[\"b35806\",\"e08214\",\"fdb863\",\"fee0b6\",\"f7f7f7\",\"d8daeb\",\"b2abd2\",\"8073ac\",\"542788\"],10:[\"7f3b08\",\"b35806\",\"e08214\",\"fdb863\",\"fee0b6\",\"d8daeb\",\"b2abd2\",\"8073ac\",\"542788\",\"2d004b\"],11:[\"7f3b08\",\"b35806\",\"e08214\",\"fdb863\",\"fee0b6\",\"f7f7f7\",\"d8daeb\",\"b2abd2\",\"8073ac\",\"542788\",\"2d004b\"]},
  BrBG:{3:[\"d8b365\",\"f5f5f5\",\"5ab4ac\"],4:[\"a6611a\",\"dfc27d\",\"80cdc1\",\"018571\"],5:[\"a6611a\",\"dfc27d\",\"f5f5f5\",\"80cdc1\",\"018571\"],6:[\"8c510a\",\"d8b365\",\"f6e8c3\",\"c7eae5\",\"5ab4ac\",\"01665e\"],7:[\"8c510a\",\"d8b365\",\"f6e8c3\",\"f5f5f5\",\"c7eae5\",\"5ab4ac\",\"01665e\"],8:[\"8c510a\",\"bf812d\",\"dfc27d\",\"f6e8c3\",\"c7eae5\",\"80cdc1\",\"35978f\",\"01665e\"],9:[\"8c510a\",\"bf812d\",\"dfc27d\",\"f6e8c3\",\"f5f5f5\",\"c7eae5\",\"80cdc1\",\"35978f\",\"01665e\"],10:[\"543005\",\"8c510a\",\"bf812d\",\"dfc27d\",\"f6e8c3\",\"c7eae5\",\"80cdc1\",\"35978f\",\"01665e\",\"003c30\"],11:[\"543005\",\"8c510a\",\"bf812d\",\"dfc27d\",\"f6e8c3\",\"f5f5f5\",\"c7eae5\",\"80cdc1\",\"35978f\",\"01665e\",\"003c30\"]},
  PRGn:{3:[\"af8dc3\",\"f7f7f7\",\"7fbf7b\"],4:[\"7b3294\",\"c2a5cf\",\"a6dba0\",\"008837\"],5:[\"7b3294\",\"c2a5cf\",\"f7f7f7\",\"a6dba0\",\"008837\"],6:[\"762a83\",\"af8dc3\",\"e7d4e8\",\"d9f0d3\",\"7fbf7b\",\"1b7837\"],7:[\"762a83\",\"af8dc3\",\"e7d4e8\",\"f7f7f7\",\"d9f0d3\",\"7fbf7b\",\"1b7837\"],8:[\"762a83\",\"9970ab\",\"c2a5cf\",\"e7d4e8\",\"d9f0d3\",\"a6dba0\",\"5aae61\",\"1b7837\"],9:[\"762a83\",\"9970ab\",\"c2a5cf\",\"e7d4e8\",\"f7f7f7\",\"d9f0d3\",\"a6dba0\",\"5aae61\",\"1b7837\"],10:[\"40004b\",\"762a83\",\"9970ab\",\"c2a5cf\",\"e7d4e8\",\"d9f0d3\",\"a6dba0\",\"5aae61\",\"1b7837\",\"00441b\"],11:[\"40004b\",\"762a83\",\"9970ab\",\"c2a5cf\",\"e7d4e8\",\"f7f7f7\",\"d9f0d3\",\"a6dba0\",\"5aae61\",\"1b7837\",\"00441b\"]},
  PiYG:{3:[\"e9a3c9\",\"f7f7f7\",\"a1d76a\"],4:[\"d01c8b\",\"f1b6da\",\"b8e186\",\"4dac26\"],5:[\"d01c8b\",\"f1b6da\",\"f7f7f7\",\"b8e186\",\"4dac26\"],6:[\"c51b7d\",\"e9a3c9\",\"fde0ef\",\"e6f5d0\",\"a1d76a\",\"4d9221\"],7:[\"c51b7d\",\"e9a3c9\",\"fde0ef\",\"f7f7f7\",\"e6f5d0\",\"a1d76a\",\"4d9221\"],8:[\"c51b7d\",\"de77ae\",\"f1b6dauence(0, keys.length)
  var distances = ee.Array(indices).multiply(step).toList().slice(1)
  var lines = line.cutLines(distances, scale).coordinates()
  indices = indices.slice(0, -1)


  var k = ee.List(keys).get(0)
  var colorCount = ee.Dictionary(ee.Dictionary(palettes).get(k)).keys().length().add(2)

  // labels
  var text = require('users/gena/packages:text')
  var labels = indices.map(function(i) {
      var k = ee.List(keys).get(i)

      var y = ee.Number(n - margin.top)
  
      var coords = ee.List(lines.get(i))
      var x = ee.Number(ee.List(coords.get(0)).get(0)).add(margin.left*0.1)
      
      var props = { fontSize: 16, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2.5, outlineOpacity: 0.6}
        
      // show palette key
      var textName = text.draw(ee.String(k), ee.Geometry.Point([x, y]), scale, props)
      
      // show max number of colors
      var colorCount = ee.Dictionary(ee.Dictionary(palettes).get(k)).keys().length().add(2)
      var textMaxColors = text.draw(colorCount.format('%d'), ee.Geometry.Point([x, y.subtract(margin.top*0.2)]), scale, props)
      
      return ee.ImageCollection.fromImages([textName, textMaxColors]).mosaic()
  })

  // add palettes
  var p = indices.map(function(i) {
      var k = ee.List(keys).get(i)
      var p = ee.Dictionary(ee.Dictionary(palettes).get(k))

      var palette = ee.Algorithms.If(ee.Number(colorCount).gte(3), 
        p.get(p.keys().get(-1)), // last
        p.get(ee.Number(colorCount).format('%d'))
      )

      var y0 = ee.Number(s + margin.bottom)
      var y1 = ee.Number(n - margin.top)
  
      var coords = ee.List(lines.get(i))
      var x0 = ee.Number(ee.List(coords.get(0)).get(0)).add(margin.left*0.05)
      var x1 = ee.Number(ee.List(coords.get(-1)).get(0))
      
      var coords = ee.Image.pixelLonLat().rename(['x', 'y'])
        .subtract([x0, y0])
        .divide([x1.subtract(x0), y1.subtract(y0)])
        
      coords = coords.mask(coords.gte(0).and(coords.lte(1)).reduce(ee.Reducer.and()))
    
      return coords.select('y').visualize({palette: palette})
    })
    
    p = ee.ImageCollection(p).mosaic()
    labels = ee.ImageCollection(labels)
    
    Map.addLayer(p, {}, 'palettes')

    Map.addLayer(labels, {}, 'labels')
    
    // on click color picker
    // buggy
    // Map.style().set('cursor', 'crosshair')
    
    Map.onClick(function(pt) {
      pt = ee.Geometry.Point(ee.Dictionary(pt).values().reverse())

      p.reduceRegion(ee.Reducer.first(), pt, scale).evaluate(function(color) {
        var r = color['vis-red']
        var g = color['vis-green']
        var b = color['vis-blue']
        
        if(!r) {
          print('Click on the palette image to pick color')
          return
        }
        
        var c = [r,g,b].map(function(i) { return parseInt(i).toString(16) }).join('')
        
        print(c)
        print(ui.Thumbnail({
          image: ee.Image(1).visualize({ palette: [c] }),
          params: { dimensions: '24x24', region: pt.buffer(scale).bounds().getInfo(), format: 'png' },
          style: { height: '24px', width: '24px'}
        }))
      })
    })
}

exports.misc = {
  coolwarm: {7:['#3B4CC0', '#6F91F2', '#A9C5FC', '#DDDDDD', '#F6B69B', '#E6745B', '#B40426']},
  warmcool: {7:['#B40426', '#E6745B', '#F6B69B', '#DDDDDD', '#A9C5FC', '#6F91F2', '#3B4CC0']},
  cubehelix: {7:['#000000', '#182E49', '#2B6F39', '#A07949', '#D490C6', '#C2D8F3', '#FFFFFF']},
  gnuplot: {7:['#000033', '#0000CC', '#5000FF', '#C729D6', '#FF758A', '#FFC23D', '#FFFF60']},
  jet: {7:['#00007F', '#002AFF', '#00D4FF', '#7FFF7F', '#FFD400', '#FF2A00', '#7F0000']},
  parula: {7:['#352A87', '#056EDE', '#089BCE', '#33B7A0', '#A3BD6A', '#F9BD3F', '#F9FB0E']},
  tol_rainbow: {7:['#781C81', '#3F60AE', '#539EB6', '#6DB388', '#CAB843', '#E78532', '#D92120']},
  cividis: {7:['#00204C', '#213D6B', '#555B6C', '#7B7A77', '#A59C74', '#D3C064', '#FFE945']},

  BlueFluorite: {7: [\"#291b32\", \"#622271\", \"#8f3b9c\", \"#9275b4\", \"#8ca9cc\", \"#98d6de\", \"#f1f3ee\"], 
    256: ['#291b32', '#2a1b34', '#2b1b34', '#2d1c36', '#2f1c38', '#301c39', '#301d3a', '#321d3b', '#331d3d', '#351d3f', '#351e40', '#371e41', '#381e43', '#3a1e45', '#3b1f45', '#3c1f46', '#3e1f48', '#3f1f4a', '#401f4c', '#42204d', '#43204e', '#44204f', '#462051', '#472052', '#482054', '#4a2056', '#4a2157', '#4c2158', '#4e215a', '#4f215b', '#50215d', '#52215e', '#532160', '#552162', '#552263', '#562264', '#582265', '#592267', '#5b2268', '#5c226b', '#5e226c', '#5f226e', '#60226f', '#622271', '#632272', '#642274', '#662276', '#672277', '#692278', '#6a227a', '#6c227b', '#6e227d', '#6e237e', '#6f247f', '#702480', '#712581', '#722681', '#732683', '#742783', '#752884', '#762985', '#772987', '#792a87', '#792b88', '#7a2c89', '#7b2c8a', '#7c2d8a', '#7d2d8c', '#7e2e8d', '#7f2f8d', '#80308e', '#813190', '#823191', '#833292', '#843292', '#863393', '#863494', '#873595', '#893596', '#8a3697', '#8b3798', '#8b3899', '#8c389a', '#8e399b', '#8e3a9c', '#8f3b9c', '#8f3d9d', '#8f3e9e', '#903f9e', '#90419e', '#90439f', '#9044a0', '#9046a0', '#9047a1', '#9049a1', '#914aa2', '#914ca2', '#914ca3', '#914ea3', '#9150a4', '#9151a5', '#9153a5', '#9154a6', '#9156a6', '#9157a7', '#9258a7', '#9259a8', '#925aa8', '#925ba9', '#925da9', '#925faa', '#9260ab', '#9260ab', '#9263ac', '#9264ac', '#9265ad', '#9266ae', '#9268ae', '#9269ae', '#926aaf', '#926bb0', '#926cb0', '#926eb1', '#926fb1', '#9270b2', '#9271b2', '#9273b3', '#9274b3', '#9275b4', '#9277b5', '#9277b5', '#9278b6', '#927ab6', '#927bb7', '#927cb7', '#927eb8', '#927fb8', '#9280b9', '#9281ba', '#9282ba', '#9284bb', '#9285bb', '#9285bc', '#9187bc', '#9188bd', '#918abd', '#918bbe', '#918cbf', '#918dbf', '#918ec0', '#918fc0', '#9191c1', '#9092c2', '#9094c2', '#9094c2', '#9095c3', '#9096c3', '#8f99c4', '#8f9ac5', '#8f9ac5', '#8f9bc6', '#8f9cc6', '#8f9dc7', '#8e9fc8', '#8ea0c8', '#8ea2c9', '#8ea3c9', '#8da5ca', '#8da5ca', '#8da6cb', '#8da7cb', '#8ca9cc', '#8caacc', '#8caccd', '#8bacce', '#8badce', '#8baecf', '#8ab0d0', '#8ab2d0', '#8ab2d1', '#8ab4d1', '#89b4d1', '#89b5d2', '#89b7d2', '#88b8d3', '#88bad4', '#87bad4', '#87bbd5', '#86bdd6', '#86bed6', '#86c0d7', '#85c0d7', '#85c1d8', '#84c3d8', '#84c4d9', '#83c5d9', '#83c6da', '#82c8da', '#82c8db', '#81cadc', '#81cbdc', '#80ccdd', '#81cddd', '#84cfdd', '#85cfdd', '#87d0dd', '#8ad0de', '#8dd1de', '#8fd2de', '#90d2de', '#92d4de', '#95d5de', '#97d5de', '#98d6de', '#9bd7de', '#9dd7df', '#a0d8df', '#a1d9df', '#a2dadf', '#a5dadf', '#a7dbdf', '#aadcdf', '#abdddf', '#acdde0', '#afdfe0', '#b1dfe0', '#b3e0e0', '#b4e1e0', '#b7e2e0', '#bae2e1', '#bae3e1', '#bee3e2', '#c0e4e3', '#c1e5e3', '#c4e6e3', '#c6e6e4', '#c8e7e4', '#cbe7e5', '#cde8e5', '#cee9e6', '#d2e9e7', '#d3eae7', '#d5eae7', '#d8ebe8', '#d9ece8', '#dcece9', '#deedea', '#dfeeea', '#e2eeea', '#e5efeb', '#e6f0eb', '#e9f0ec', '#ebf1ed', '#ecf2ed', '#eff3ee', '#f1f3ee'],
  },

  Water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b'],
  RedToBlue: ['67001f','b2182b','d6604d','f4a582','fddbc7','d1e5f0','92c5de','4393c3','2166ac','053061'],
  Hot: ['000000',  'f03b20', 'ffff55', 'ffffb2', 'ffffee'],
  WhiteToRed: ['ffffff', 'ff0000'],
  BlackToRedToWhite: ['000000', 'ff0000','ffffff'],
  BlueToRedToWhite: ['2171b5', 'e31a1c','ffffb2','ffffff'],
  BlueToWhiteToRed: ['2171b5', 'ffffff','e31a1c'],
  BlackToBlue: ['1a1a1a', '4d4d4d', '878787', 'bababa', 'e0e0e0','d1e5f0','92c5de','4393c3','2166ac','053061'],
  
}

exports.niccoli = {
  cubicyf: {7:['#830CAB', '#7556F3', '#5590E7', '#3BBCAC', '#52D965', '#86EA50', '#CCEC5A']},
  cubicl: {7:['#780085', '#7651EE', '#4C9ED9', '#49CF7F', '#85EB50', '#D4E35B', '#F9965B']},
  isol: {7:['#E839E5', '#7C58FA', '#2984B9', '#0A9A4D', '#349704', '#9E7C09', '#FF3A2A']},
  linearl: {7:['#040404', '#2C1C5D', '#114E81', '#00834B', '#37B200', '#C4CA39', '#F7ECE5']},
  linearlhot: {7:['#060303', '#620100', '#B20022', '#DE2007', '#D78E00', '#C9CE00', '#F2F2B7']}
}

exports.matplotlib = {
  magma: {7:['#000004', '#2C105C', '#711F81', '#B63679', '#EE605E', '#FDAE78', '#FCFDBF']},
  inferno: {7:['#000004', '#320A5A', '#781B6C', '#BB3654', '#EC6824', '#FBB41A', '#FCFFA4']},
  plasma: {7:['#0D0887', '#5B02A3', '#9A179B', '#CB4678', '#EB7852', '#FBB32F', '#F0F921']},
  viridis: {7:['#440154', '#433982', '#30678D', '#218F8B', '#36B677', '#8ED542', '#FDE725']}
}

exports.kovesi = {
  cyclic_grey_15_85_c0: {7:['#787878', '#B0B0B0', '#B0B0B0', '#767676', '#414141', '#424242', '#767676']},
  cyclic_grey_15_85_c0_s25: {7:['#2D2D2D', '#5B5B5B', '#949494', '#CACACA', '#949494', '#5A5A5A', '#2D2D2D']},
  cyclic_mrybm_35_75_c68: {7:['#F985F8', '#D82D5F', '#C14E04', '#D0AA25', '#2C76B1', '#7556F9', '#F785F9']},
  cyclic_mrybm_35_75_c68_s25: {7:['#3E3FF0', '#B976FC', '#F55CB1', '#B71C18', '#D28004', '#8E9871', '#3C40EE']},
  cyclic_mygbm_30_95_c78: {7:['#EF55F2', '#FCC882', '#B8E014', '#32AD26', '#2F5DB9', '#712AF7', '#ED53F3']},
  cyclic_mygbm_30_95_c78_s25: {7:['#2E22EA', '#B341FB', '#FC93C0', '#F1ED37', '#77C80D', '#458873', '#2C24E9']},
  cyclic_wrwbw_40_90_c42: {7:['#DFD5D8', '#D9694D', '#D86449', '#DDD1D6', '#6C81E5', '#6F83E5', '#DDD5DA']},
  cyclic_wrwbw_40_90_c42_s25: {7:['#1A63E5', '#B0B2E4', '#E4A695', '#C93117', '#E3A18F', '#ADB0E4', '#1963E5']},
  diverging_isoluminant_cjm_75_c23: {7:['#00C9FF', '#69C3E8', '#98BED0', '#B8B8BB', '#CBB1C6', '#DCA8D5', '#ED9EE4']},
  diverging_isoluminant_cjm_75_c24: {7:['#00CBFE', '#62C5E7', '#96BFD0', '#B8B8BB', '#CCB1C8', '#DEA7D6', '#F09DE6']},
  diverging_isoluminant_cjo_70_c25: {7:['#00B6FF', '#67B2E4', '#8FAFC7', '#ABABAB', '#C7A396', '#E09A81', '#F6906D']},
  diverging_linear_bjr_30_55_c53: {7:['#002AD7', '#483FB0', '#5E528A', '#646464', '#A15C49', '#D44A2C', '#FF1900']},
  diverging_linear_bjy_30_90_c45: {7:['#1431C1', '#5A50B2', '#796FA2', '#938F8F', '#B8AB74', '#DAC652', '#FDE409']},
  diverging_rainbow_bgymr_45_85_c67: {7:['#085CF8', '#3C9E49', '#98BB18', '#F3CC1D', '#FE8F7B', '#F64497', '#D70500']},
  diverging_bkr_55_10_c35: {7:['#1981FA', '#315CA9', '#2D3B5E', '#221F21', '#5C2F28', '#9E4035', '#E65041']},
  diverging_bky_60_10_c30: {7:['#0E94FA', '#2F68A9', '#2D405E', '#212020', '#4C3E20', '#7D6321', '#B38B1A']},
  diverging_bwr_40_95_c42: {7:['#2151DB', '#8182E3', '#BCB7EB', '#EBE2E6', '#EEAD9D', '#DC6951', '#C00206']},
  diverging_bwr_55_98_c37: {7:['#2480FF', '#88A4FD', '#C4CDFC', '#F8F6F7', '#FDC1B3', '#F58B73', '#E65037']},
  diverging_cwm_80_100_c22: {7:['#00D9FF', '#89E6FF', '#C9F2FF', '#FEFFFF', '#FEE3FA', '#FCC9F5', '#FAAEF0']},
  diverging_gkr_60_10_c40: {7:['#36A616', '#347420', '#2B4621', '#22201D', '#633226', '#AC462F', '#FD5838']},
  diverging_gwr_55_95_c38: {7:['#39970E', '#7DB461', '#B7D2A7', '#EDEAE6', '#F9BAB2', '#F78579', '#ED4744']},
  diverging_gwv_55_95_c39: {7:['#39970E', '#7DB461', '#B7D2A7', '#EBEBEA', '#E0BEED', '#CD8DE9', '#B859E4']},
  isoluminant_cgo_70_c39: {7:['#37B7EC', '#4DBAC6', '#63BB9E', '#86B876', '#B3AE60', '#D8A05F', '#F6906D']},
  isoluminant_cgo_80_c38: {7:['#70D1FF', '#74D4E0', '#80D6BA', '#9BD594', '#C4CC7D', '#EABF77', '#FFB281']},
  isoluminant_cm_70_c39: {7:['#14BAE6', '#5DB2EA', '#8CAAEB', '#B0A1E3', '#CF98D3', '#E98FC1', '#FE85AD']},
  rainbow_bgyr_35_85_c72: {7:['#0034F5', '#1E7D83', '#4DA910', '#B3C120', '#FCC228', '#FF8410', '#FD3000']},
  rainbow_bgyr_35_85_c73: {7:['#0035F9', '#1E7D83', '#4DA910', '#B3C01A', '#FDC120', '#FF8303', '#FF2A00']},
  rainbow_bgyrm_35_85_c69: {7:['#0030F5', '#36886A', '#82B513', '#EDC823', '#F68E19', '#F45A44', '#FD92FA']},
  rainbow_bgyrm_35_85_c71: {7:['#0035F9', '#34886A', '#80B412', '#F1CA24', '#FD8814', '#FE4E41', '#FD92FA']},
  linear_bgy_10_95_c74: {7:['#000C7D', '#002CB9', '#005EA3', '#198E61', '#32BA1A', '#70E21A', '#FFF123']},
  linear_bgyw_15_100_c67: {7:['#1B0084', '#1D26C7', '#2E68AB', '#4C9A41', '#95BE16', '#E1DB41', '#FFFFFF']},
  linear_bgyw_15_100_c68: {7:['#1A0086', '#1B27C8', '#2469AD', '#4B9B41', '#95BE16', '#E1DB41', '#FFFFFF']},
  linear_blue_5_95_c73: {7:['#00014E', '#0E02A8', '#2429F4', '#2D6CFD', '#36A3FD', '#2CD8FA', '#B3FFF6']},
  linear_blue_95_50_c20: {7:['#F1F1F1', '#D0DCEC', '#B1C8E6', '#93B5DC', '#7BA1CA', '#5E8EBC', '#3B7CB2']},
  linear_bmw_5_95_c86: {7:['#00024B', '#0708A6', '#451AF4', '#B621FE', '#F957FE', '#FEA8FD', '#FEEBFE']},
  linear_bmw_5_95_c89: {7:['#000558', '#0014BF', '#251EFA', '#B71EFF', '#F655FF', '#FFA6FF', '#FEEBFE']},
  linear_bmy_10_95_c71: {7:['#000F5D', '#48188F', '#A60B8A', '#E4336F', '#F97E4A', '#FCBE39', '#F5F94E']},
  linear_bmy_10_95_c78: {7:['#000C7D', '#3013A7', '#A7018B', '#EE1774', '#FF7051', '#FFB722', '#FFF123']},
  linear_gow_60_85_c27: {7:['#669B90', '#87A37D', '#B4A671', '#D4AC6A', '#D8B97A', '#D7C6A6', '#D4D4D4']},
  linear_gow_65_90_c35: {7:['#70AD5C', '#A3B061', '#CCB267', '#E6B86D', '#E7C786', '#E5D5B3', '#E2E2E2']},
  linear_green_5_95_c69: {7:['#011506', '#093805', '#146007', '#1F890B', '#2AB610', '#35E415', '#D8FF15']},
  linear_grey_0_100_c0: {7:['#000000', '#272727', '#4E4E4E', '#777777', '#A2A2A2', '#CFCFCF', '#FFFFFF']},
  linear_grey_10_95_c0: {7:['#1B1B1B', '#393939', '#5A5A5A', '#7D7D7D', '#A2A2A2', '#C9C9C9', '#F1F1F1']},
  linear_kry_5_95_c72: {7:['#111111', '#660304', '#A80502', '#E72205', '#FE7310', '#F4BE26', '#F7F909']},
  linear_kry_5_98_c75: {7:['#111111', '#6B0004', '#AF0000', '#F50C00', '#FF7705', '#FFBF13', '#FFFE1C']},
  linear_kryw_5_100_c64: {7:['#111111', '#6A0303', '#B00703', '#F02C06', '#FE8714', '#F3CE4C', '#FFFFFF']},
  linear_kryw_5_100_c67: {7:['#111111', '#6C0004', '#B20000', '#F81300', '#FF7D05', '#FFC43E', '#FFFFFF']},
  linear_ternary_blue_0_44_c57: {7:['#000000', '#051238', '#091F5E', '#0D2B83', '#1139AB', '#1546D3', '#1A54FF']},
  linear_ternary_green_0_46_c42: {7:['#000000', '#001C00', '#002E00', '#004100', '#005500', '#006900', '#008000']},
  linear_ternary_red_0_50_c52: {7:['#000000', '#320900', '#531000', '#761600', '#991C00', '#BE2400', '#E62B00']}
}

exports.crameri = {
  acton: {
    10: ['2E214D','4B3B66','6E5480','926390','B26795','D17BA5','D495B8','D4ADC9','DBC9DC','E6E6F0'],
    25: ['2E214D','392B57','443460','503E6A','5C4974','69517D','775A86','855F8C','926390','9F6593','AA6694','B76896','C46E9B','CE77A2','D482AA','D58CB1','D495B8','D39EBE','D4A6C4','D5B0CB','D7BBD2','DAC5D9','DED0E1','E1DAE8','E6E6F0'],
    50: ['2E214D','332651','382A56','3E305B','443460','493964','4F3D69','54426E','5B4873','614C78','68507C','6E5480','755884','7D5C88','835F8B','8A618E','906390','966491','9D6592','A26693','A86694','AD6795','B36795','BA6997','C06C99','C6709C','CB74A0','D07AA4','D37FA8','D484AC','D589AF','D58DB2','D492B6','D496B9','D49ABC','D39FBF','D3A3C2','D4A8C5','D4ADC9','D5B1CC','D6B6CF','D7BBD2','D9C1D7','DAC6DA','DCCBDD','DED0E1','DFD5E4','E2DBE9','E4E0EC','E6E6F0']
  },
  bamako: {
    10: ['00404D','134B42','265737','3A652A','52741C','71870B','969206','C5AE32','E7CD68','FFE599'],
    25: ['00404D','084449','0F4845','154C41','1C513C','235538','2B5A34','325F2F','3A652A','436A25','4C7020','56771A','617E14','6C840E','7A8B06','878E03','969206','A89A14','B9A525','CBB33A','D9BF4F','E3C961','EDD375','F6DC86','FFE599'],
    50: ['00404D','04424B','074449','0B4647','0F4845','124A43','154C41','184E3F','1C513D','1F533B','225539','265737','295A34','2D5C32','315F30','35612D','39642B','3D6629','416926','466C24','4A6F21','4E721F','53751C','597819','5E7C16','637F13','698210','70860C','768908','7D8C05','838E03','8A8F03','929104','999308','A1960F','AA9B16','B2A01E','BCA829','C5AE32','CCB43B','D3BA45','D9BF4F','DFC55A','E4CA63','E8CF6C','EDD375','F1D87D','F6DD88','FBE190','FFE599']
  },
  batlow: {
    10: ['011959','0E365E','1D5561','3E6C55','687B3E','9B882E','D59448','F9A380','FDB7BD','FACCFA'],
    25: ['011959','07255B','0B2F5D','0F3B5F','144660','1A5161','235C60','2F655C','3E6C55','4E734C','5D7844','6E7D3B','818233','93862E','AA8C2F','BF9038','D59448','E8995C','F49E71','FBA689','FDADA0','FDB4B5','FDBCCC','FCC4E2','FACCFA'],
    50: ['011959','041F5A','06245B','092A5C','0B2F5D','0D345E','0F3A5F','113F60','134560','164B61','195061','1D5561','215A60','28605F','2E645C','34685A','3B6B56','426E53','4B724E','53744A','5A7746','627941','6A7B3D','737E38','7B8035','848332','8D852F','99882E','A38A2E','AE8D31','B98F35','C3913B','CF9343','D9954B','E19755','E9995E','EF9C69','F5A076','F9A380','FBA68B','FDAA96','FDADA0','FDB1AD','FDB5B7','FDB9C2','FDBCCC','FCC0D7','FCC4E4','FBC8EF','FACCFA']
  },
  berlin: {
    10: ['9EB0FF','5BA4DB','2D7597','1A4256','11191E','280D01','501803','8A3F2A','C4756A','FFADAD'],
    25: ['9EB0FF','85ADF3','6CA9E6','519FD3','3C8EB9','317CA1','286886','21556E','1A4256','14303E','11212A','111418','190C09','240C02','310F00','3F1201','501803','65230E','7B321C','924632','A85A4A','BC6D61','D2837A','E79792','FFADAD'],
    50: ['9EB0FF','93AFFA','87ADF4','79ABED','6CA9E6','60A5DF','54A0D5','489ACA','3E90BC','3787AF','327EA3','2D7597','296B8B','25607C','225771','1E4E65','1B465A','183D4F','153342','122C38','11242E','101D25','11181C','121214','160E0D','1B0B07','210B03','270D01','2D0E00','340F00','3B1100','421301','4B1602','541905','5D1E09','68240F','732B16','803620','8A3F2A','944834','9E513F','A85A4A','B46658','BE6F63','C8796F','D2837A','DD8D86','EA9995','F4A3A1','FFADAD']
  },
  bilbao: {
    10: ['FFFFFF','DCDBD9','C5C0AF','B9AF8B','AE946D','A67A60','9E6155','8D4341','6E2222','4D0001'],
    25: ['FFFFFF','F1F1F0','E4E4E3','D7D7D3','CDCBC3','C7C3B5','C2BCA6','BEB699','B9AF8B','B5A57C','B19B72','AD906A','AA8665','A77E62','A4745D','A26B59','9E6155','9A564F','934B47','8A3F3D','7E3231','732726','661A1B','5A0E11','4D0001'],
    50: ['FFFFFF','F8F8F8','F2F2F2','EAEAEA','E4E4E3','DEDEDC','D9D8D5','D3D2CD','CECCC4','CAC8BD','C7C4B6','C5C0AF','C2BDA9','C0B9A1','BEB79A','BCB394','BAB08D','B8AC87','B5A77F','B3A279','B19D74','AF9870','AE936C','AC8E69','AB8967','A98565','A88063','A67B60','A5775E','A4725D','A36E5B','A16959','9F6456','9E5F54','9C5A51','99554E','96504B','924946','8D4341','893E3C','833837','7E3231','772B2B','722625','6C2020','661A1B','601516','590D10','530609','4D0001']
  },
  broc: {
    10: ['2C1A4C','284477','4B76A0','8BA7C2','CED9E5','E8E8D2','C5C58F','8D8D56','555527','262600'],
    25: ['2C1A4C','2B2A5D','29396C','294B7D','315E8E','436F9B','5B82A9','7193B5','8BA7C2','A5BBD0','BDCDDC','D7E0E9','EBEEEC','ECECDB','E0E0C1','D4D4AA','C5C58F','B0B075','9B9B62','85854F','70703D','5D5D2D','49491D','373810','262600'],
    50: ['2C1A4C','2B2154','2B295B','2A3164','29396C','284174','29497C','2A5183','305C8C','376593','416D9A','4B76A0','567FA6','6489AD','6F92B3','7B9BBA','86A3C0','92ACC6','A0B7CD','ACC0D3','B8C9DA','C4D2E0','D0DBE6','DEE5EC','E7ECED','EDEFE9','EDEEE1','E9E9D4','E4E4C8','DEDEBD','D8D8B1','D2D2A5','C9C996','C1C18A','B8B87E','AEAE73','A3A369','97975E','8D8D56','83834D','797945','70703D','646434','5B5B2C','525224','49491D','404016','36360F','2E2E08','262600']
  },
  buda: {
    10: ['B301B3','B32B9E','B94892','C2618A','CA7982','D1917B','D7AA75','DDC36F','E5DF68','FFFF66'],
    25: ['B301B3','B316A9','B323A2','B32F9C','B53A97','B84494','BC4E90','BF578D','C2618A','C56A87','C87384','CB7C81','CD857E','D08E7C','D2977A','D4A077','D7AA75','D9B473','DBBD70','DEC76E','E0D16B','E3DB69','E9E667','F2F266','FFFF66'],
    50: ['B301B3','B30BAE','B314AA','B31CA6','B323A2','B3289F','B32E9D','B4339A','B53998','B63E96','B84394','B94892','BB4C91','BD528F','BE568D','C05B8C','C15F8A','C36389','C46987','C66D86','C77184','C97583','CA7982','CB7E80','CD837F','CE877E','CF8B7D','D0917B','D1957A','D29979','D49E78','D5A277','D6A776','D7AC75','D8B073','D9B572','DAB971','DCBF70','DDC36F','DEC86E','DFCC6C','E0D16B','E2D76A','E4DC69','E6E168','E9E667','EDEC67','F3F366','F9F966','FFFF66']
  },
  cork: {
    10: ['2C1A4C','2A4375','48729E','84A1BE','C3D2DF','CDE1CF','95C199','5E9F62','407027','424D03'],
    25: ['2C1A4C','2B295C','2A386B','2A497B','325B8B','416C99','577EA6','6C8FB2','84A1BE','9DB4CB','B3C6D7','CBD8E3','DBE6E5','D4E5D7','BFDAC2','ABCEAE','95C199','7FB483','6BA870','569959','478741','41762E','41661D','425A10','424D03'],
    50: ['2C1A4C','2C2153','2B285B','2A3163','2A386B','2A3F72','2A477A','2C4F81','31598A','376291','3F6A97','48729E','527BA4','5F85AB','6A8DB0','7596B6','809EBC','8BA7C2','98B1C9','A3B9CF','AFC2D5','BACBDB','C5D3E0','D1DDE5','D8E4E6','DBE7E3','D8E7DC','CFE2D1','C5DDC8','BBD7BE','B1D1B4','A7CBAA','9BC49E','91BE95','87B98B','7DB381','73AD78','67A56C','5E9F62','559857','4D904C','478741','427D35','41752C','406D24','41661D','416017','42580F','425208','424D03']
  },
  davos: {
    10: ['00054A','112C71','295291','43709D','5E8598','79968D','99AD88','C9D29E','F3F3D2','FEFEFE'],
    25: ['00054A','05165A','0C2368','143277','1D4084','254D8E','2F5A96','39659B','43709D','4E799D','57809B','628797','6C8E93','75948F','809B8B','8BA388','99AD88','A9B98B','BBC794','D0D8A4','E3E7B8','EFF0CB','F7F7DE','FCFBEE','FEFEFE'],
    50: ['00054A','010E51','041459','081C61','0C2368','102A6F','133075','17377C','1C3F83','204588','244C8D','295291','2D5895','335F98','38649A','3C699C','416E9D','46729D','4C779D','517B9C','567F9B','5A829A','5F8598','658996','698C94','6E8F92','739290','78968D','7D998C','829D8A','88A089','8DA488','95AA87','9BAF88','A3B489','ABBB8C','B4C190','BFCA96','C9D29E','D2D9A6','DBE0AF','E3E7B8','EBEDC4','F0F1CD','F4F4D6','F7F7DE','FAF9E6','FCFCF0','FDFDF7','FEFEFE']
  },
  devon: {
    10: ['2C1A4C','293467','275186','3669AD','6181D0','989BE7','BAB3F1','D0CCF5','E8E5FA','FFFFFF'],
    25: ['2C1A4C','2B2457','2A2D60','29386A','274275','274D81','29588F','2E619D','3669AD','4272BC','537BC9','6985D4','7E8FDD','9197E4','A3A1EA','AFAAEE','BAB3F1','C2BDF3','CAC6F4','D3CFF6','DCD9F8','E4E2FA','EDECFB','F6F5FD','FFFFFF'],
    50: ['2C1A4C','2B1E51','2B2356','2A295B','2A2D60','293265','29376A','283B6E','274174','27467A','274C7F','275186','28568C','2A5C95','2D609C','3064A3','3468AA','396BB1','3F70B9','4774C0','4F79C6','597DCC','6382D1','6F88D7','798CDB','8290DF','8C95E2','969AE6','9E9EE9','A6A3EB','ACA7ED','B1ACEF','B7B1F0','BBB5F1','BFB9F2','C3BEF3','C7C2F4','CCC7F4','D0CCF5','D4D0F6','D8D4F7','DCD9F8','E1DEF9','E5E3FA','E9E7FB','EDECFB','F2F0FC','F7F6FD','FBFAFE','FFFFFF']
  },
  grayC: {
    10: ['FFFFFF','E0E0E0','C0C0C0','A2A2A2','858585','696969','4E4E4E','353535','1D1D1D','000000'],
    25: ['FFFFFF','F3F3F3','E7E7E7','DBDBDB','CFCFCF','C4C4C4','B8B8B8','AEAEAE','A2A2A2','979797','8C8C8C','818181','767676','6D6D6D','626262','595959','4E4E4E','444444','3C3C3C','323232','292929','212121','181818','0F0F0F','000000'],
    50: ['FFFFFF','F9F9F9','F4F4F4','EDEDED','E7E7E7','E2E2E2','DCDCDC','D7D7D7','D0D0D0','CBCBCB','C5C5C5','C0C0C0','BABABA','B4B4B4','AFAFAF','A9A9A9','A4A4A4','9F9F9F','999999','949494','8F8F8F','898989','848484','7E7E7E','797979','747474','707070','6A6A6A','656565','606060','5B5B5B','575757','515151','4D4D4D','484848','434343','3F3F3F','3A3A3A','353535','313131','2D2D2D','292929','242424','202020','1C1C1C','181818','141414','0E0E0E','070707','000000']
  },
  hawaii: {
    10: ['8C0273','922A59','964742','996330','9D831E','97A92A','80C55F','66D89C','6CEBDB','B3F2FD'],
    25: ['8C0273','8F1668','91235F','922E55','94394D','954345','974E3E','985737','996330','9B6F28','9C7A22','9D881D','9C961C','99A424','92B135','8ABC48','80C55F','75CD76','6CD48C','63DBA5','5FE2BD','66E8D3','7AEEE7','95F1F4','B3F2FD'],
    50: ['8C0273','8E0D6E','8F1569','901D63','91235F','91285A','922D56','933252','94384D','943D4A','954246','964742','964C3F','97523B','985638','985C34','996131','9A662E','9B6C2A','9B7226','9C7823','9C7E20','9D841E','9D8C1C','9C921C','9B991D','9AA021','97A828','94AE30','91B439','8CB942','88BE4C','82C359','7EC663','79CA6E','74CE79','70D183','6AD591','66D89C','62DCA7','60DFB2','5FE2BD','61E6CA','67E9D5','6FEBDE','7AEEE7','87EFEE','98F1F5','A6F1F9','B3F2FD']
  },
  imola: {
    10: ['1A33B3','2446A9','2E599F','396B94','497B85','60927B','7BAE74','98CB6D','C4EA67','FFFF66'],
    25: ['1A33B3','1E3BAF','2242AB','2549A8','2950A4','2C57A1','305E9D','346499','396B94','3F718E','457789','4C7E83','54867F','5C8F7C','679979','70A377','7BAE74','86B971','91C36F','9DCF6C','ACDB69','BDE667','D3F066','E8F766','FFFF66'],
    50: ['1A33B3','1C37B1','1E3AAF','203EAD','2242AB','2345AA','2548A8','274CA6','2950A4','2A53A3','2C56A1','2E599F','2F5D9E','32609B','346499','366797','386A95','3B6C92','3E708F','41738C','44768A','467987','4A7C85','4E8082','518480','56887E','5A8C7D','5F927B','64967A','689B79','6DA078','72A576','78AB75','7DB074','82B572','87BA71','8CBF70','93C66E','98CB6D','9ED06C','A4D66A','ACDB69','B5E268','BFE767','C8EB67','D3F066','DDF466','EAF866','F5FB66','FFFF66']
  },
  lajolla: {
    10: ['FFFFCC','FBEC9A','F4CC68','ECA855','E48751','D2624D','A54742','73382F','422818','1A1A01'],
    25: ['FFFFCC','FEF8B8','FDF1A6','FBE992','F8DE7E','F5D26D','F2C360','EFB558','ECA855','E99B53','E68F52','E38251','DE744F','D6674E','C8594B','B84F47','A54742','91413C','7F3B34','6C362C','593023','492A1B','372513','291F0C','1A1A01'],
    50: ['FFFFCC','FFFCC3','FEF9BA','FDF5AF','FDF1A6','FCEE9D','FBEA94','FAE58B','F8DF80','F7D977','F6D36F','F4CC68','F2C562','F1BD5C','EFB759','EEB057','ECAA55','EBA454','EA9D53','E89752','E79152','E68C51','E48651','E27E50','DF7850','DD724F','D96B4E','D3634D','CD5D4C','C5574A','BD5248','B54D46','AA4944','A14641','98433E','8F403B','863E37','7B3A33','73382F','6A352B','613227','593023','4F2C1E','472A1A','3F2717','372513','302210','271F0B','201C06','1A1A01']
  },
  lapaz: {
    10: ['1A0C64','232D7B','2A4C8F','36679D','4C80A3','6E95A1','94A298','BFB199','EFD3C0','FEF2F3'],
    25: ['1A0C64','1E1A6D','212675','24327E','263D86','29488C','2D5393','305D98','36679D','3D71A0','457AA2','5084A4','5C8CA3','6893A2','77999F','859E9C','94A298','A4A795','B3AC96','C7B59C','DAC1A8','EACEB9','F5DBCD','FBE7DF','FEF2F3'],
    50: ['1A0C64','1C1368','1E196D','202071','212675','222B79','23317D','253681','263C85','274189','29478C','2A4C8F','2C5192','2E5795','305C98','32609A','35659C','386A9E','3C70A0','3F74A1','4379A2','487DA3','4D81A3','5386A4','588AA3','5E8EA3','6591A2','6C95A1','7398A0','7A9A9E','809D9D','879F9B','90A199','97A397','9EA596','A5A795','ADAA95','B7AD96','BFB199','C8B69C','D2BBA2','DAC1A8','E4C9B2','EBCFBB','F1D5C4','F5DBCD','F9E1D6','FBE8E1','FDEDEA','FEF2F3']
  },
  lisbon: {
    10: ['E6E5FF','9BAFD3','5177A4','1E4368','111E2C','27251A','575134','8D8556','C9C390','FFFFD9'],
    25: ['E6E5FF','C8D0ED','ADBCDE','90A7CC','7492BB','5B7FAB','416A97','2D5782','1E4368','16334F','12253A','121B25','171919','212018','322F1F','433F28','575134','6B6540','7F784C','968D5C','ADA470','C1BA87','D7D2A2','EAE7BC','FFFFD9'],
    50: ['E6E5FF','D8DCF7','CBD2EF','BBC6E5','ADBCDE','A0B3D6','93A9CE','86A0C6','7794BD','6A8BB5','5E81AC','5177A4','456E9B','38628F','2F5984','274F78','20476D','1B3F61','173653','142E48','12283E','112233','111D2A','121921','15181B','181A18','1E1D17','252419','2D2B1C','353220','3E3A25','46422A','514C31','5A5536','645E3C','6D6741','777047','837B4F','8D8556','988F5E','A29A67','ADA470','B9B17D','C3BC89','CDC795','D7D2A2','E0DCAF','ECE9BE','F5F4CB','FFFFD9']
  },
  nuuk: {
    10: ['05598C','296284','4A7283','6F878D','929C96','ABAD96','BAB98D','C7C684','E0E08E','FEFEB2'],
    25: ['05598C','175C88','226085','2D6483','396982','456F82','537785','607E88','6F878D','7D8F91','8A9795','969E97','A1A698','A9AB97','B0B194','B5B591','BAB98D','BEBE89','C3C285','C9C983','D2D184','DCDB8A','E8E895','F3F3A3','FEFEB2'],
    50: ['05598C','0E5B8B','155C89','1C5E87','226085','276184','2C6383','326682','386982','3E6C82','446F82','4A7283','517584','587A86','5F7D88','66818A','6C858C','73898E','7B8E91','819192','879594','8D9996','939C97','99A097','9EA498','A2A798','A6AA97','ABAD96','AEAF95','B1B194','B3B492','B6B690','B8B88E','BABA8C','BDBC8A','BFBE88','C1C187','C4C385','C7C684','CAC983','CDCD83','D2D184','D7D787','DDDD8B','E3E290','E8E895','EEEE9C','F4F4A4','F9F9AB','FEFEB2']
  },
  oleron: {
    10: ['1A2659','455285','7784B7','AAB7E8','D3E0FA','3C5600','7A711F','B79A5E','F1CEA4','FDFDE6'],
    25: ['1A2659','2B376A','3A477A','4C598C','5E6B9E','707DB0','8390C3','96A2D5','AAB7E8','BCC9F3','CAD6F8','D8E5FC','1A4C00','335400','4B5B01','606309','7A711F','928037','A88F4E','C1A167','D9B581','ECC79A','F6DAB5','F9EACC','FDFDE6'],
    50: ['1A2659','212E61','293568','323F72','3A477A','424F82','4A578A','535F92','5D699C','6572A5','6E7BAE','7784B7','808DC0','8B97CA','94A1D3','9DAADC','A6B3E5','AFBCEC','B9C6F2','C0CDF5','C7D4F7','CEDAF9','D4E1FB','DCE9FD','E3F0FE','1F4E00','2C5100','3A5600','445900','4F5C02','5A6005','65660C','736D18','7E7423','8A7B2E','94823A','9F8945','AC9253','B79A5E','C3A36A','CEAC75','D9B581','E5C090','EDC99D','F2D2A9','F6DAB5','F8E2C0','FAECCE','FBF4DA','FDFDE6']
  },
  oslo: {
    10: ['010101','0D1B29','133251','1F4C7B','3869A8','658AC7','89A0CA','AAB6CA','D4D6DB','FFFFFF'],
    25: ['010101','070D15','0C1620','0E1E2E','10263D','122F4B','15395B','19426A','1F4C7B','26578C','30619C','3E6DAE','507BBC','6086C5','6F90C9','7B98CA','89A0CA','96A9C9','A2B0CA','B0BACB','BFC5CF','CED1D7','DEE0E2','EEEEEF','FFFFFF'],
    50: ['010101','04070B','060C13','0A121B','0C1620','0D1927','0E1D2D','0F2133','10263C','112A43','122E4A','133251','153758','173C61','194169','1B4670','1E4A78','214F80','255589','295A91','2E5F99','3364A1','3A6AA9','4371B2','4B77B9','537DBE','5B83C3','6489C6','6B8EC8','7292C9','7896C9','7E9ACA','859ECA','8BA2C9','91A6C9','97A9C9','9DADC9','A4B2CA','AAB6CA','B1BBCB','B8BFCD','BFC5CF','C7CCD3','CFD2D8','D7D9DD','DEE0E2','E6E7E9','EFF0F1','F7F7F8','FFFFFF']
  },
  roma: {
    10: ['7F1900','9D5918','B99333','D9CF6D','DFEAB2','A9E4D5','61BDD3','428CBF','2F5EAB','1A3399'],
    25: ['7F1900','8B3509','964B12','A1611C','AC7625','B58A2E','C1A23C','CDB84F','D9CF6D','E1DF8B','E2E7A3','DBEBB9','CAEBC9','B3E7D3','95DDD7','7AD0D7','61BDD3','52AACC','4898C5','4085BD','3874B5','3264AE','2B53A7','2444A0','1A3399'],
    50: ['7F1900','842705','8A3308','91400E','964B12','9B5516','A05F1B','A5691F','AB7424','AF7E28','B4882D','B99333','BF9D39','C5AB43','CBB64D','D1C159','D7CC67','DCD575','E0DD86','E2E293','E3E69F','E1E9AA','DEEAB4','D7EBBE','D0EBC5','C6EBCB','BBE9D0','ABE5D4','9EE1D7','8FDBD8','82D4D8','75CCD6','67C2D4','5EBAD1','57B1CE','50A8CB','4B9FC7','4695C3','428CBF','3F84BC','3B7CB8','3874B5','346AB1','3162AD','2E5AAA','2B53A7','274BA3','2342A0','1F3B9C','1A3399']
  },
  tofino: {
    10: ['DED9FF','93A4DE','4A6BAC','273C65','121926','122214','244D28','3F8144','88B970','DBE69B'],
    25: ['DED9FF','C0C4F2','A6B1E6','889DD9','6B87CA','5373B6','3E5E9A','324D80','273C65','1D2D4A','162034','101620','0D1613','101E12','152C18','1C3B1F','244D28','2D6132','37733C','468949','5FA059','7CB369','9DC57B','BAD48A','DBE69B'],
    50: ['DED9FF','D0CFF9','C3C6F3','B3BBEC','A6B1E6','98A8E1','8B9FDB','7E95D4','6E89CB','617FC3','5575B8','4A6BAC','4262A0','395790','334F83','2E4776','293F6A','24385D','1F304F','1B2943','172338','141D2E','111824','0F151B','0D1516','0D1712','0F1B12','112113','142716','162F19','1A361C','1D3E20','224825','26512A','2A5A2E','2E6233','336C38','39773E','3F8144','488B4A','529551','5FA059','70AB63','7FB46B','8EBD73','9DC57B','ACCD83','BDD68C','CCDE94','DBE69B']
  },
  tokyo: {
    10: ['1A0E34','45204C','6E3E67','855E78','8D7982','929489','97AE91','A7CE9D','D5F2BC','FEFED8'],
    25: ['1A0E34','2B143D','3A1A46','4B2350','5C2E5A','693964','76466C','7E5273','855E78','89697D','8C7380','8E7D83','908786','919088','939A8B','95A48E','97AE91','9BB994','A1C599','ACD3A0','BCE2AB','CEEEB7','E1F7C4','F0FCCE','FEFED8'],
    50: ['1A0E34','221138','2A143C','331741','3A1A46','421E4A','4A224F','512754','5A2D59','61325E','683863','6E3E67','74446B','7A4B6F','7E5172','815775','845C77','86617A','88677C','8A6C7E','8B717F','8C7681','8D7A82','8E8084','8F8485','908986','918D88','929389','92988A','939C8C','94A18D','95A58E','96AB90','98B091','99B593','9BBB95','9EC097','A2C79A','A7CE9D','ADD4A1','B4DBA6','BCE2AB','C7EAB2','D0EFB8','D9F3BE','E1F7C4','E9FAC9','F1FCCF','F8FDD4','FEFED8']
  },
  turku: {
    10: ['000000','242420','424235','5F5F44','7E7C52','A99965','CFA67C','EAAD98','FCC7C3','FFE6E6'],
    25: ['000000','121211','1D1D1A','282823','34332C','3E3E33','49493A','54533F','5F5F44','6B6A49','76744E','838054','938C5B','A29562','B39E6B','C2A373','CFA67C','DBA885','E4AA8F','EEB09E','F6B9AE','FBC3BD','FECFCC','FFDAD9','FFE6E6'],
    50: ['000000','090908','111110','181816','1D1D1A','22221F','272723','2C2C27','33322B','38382F','3D3D32','424235','474738','4E4D3C','53523E','585841','5D5D43','626246','686848','6E6D4B','73724D','797750','7F7D52','878356','8E8859','968E5C','9D9360','A79864','AF9C68','B69F6C','BEA270','C4A474','CCA579','D1A67D','D7A781','DBA886','E0A98B','E6AB92','EAAD98','EFB09F','F2B4A7','F6B9AE','F9BFB7','FBC4BF','FDC9C6','FECFCC','FED4D3','FFDBDA','FFE0E0','FFE6E6']
  },
  vik: {
    10: ['001261','033E7D','1E6F9D','71A8C4','C9DDE7','EACEBD','D39774','BE6533','8B2706','590008'],
    25: ['001261','02236C','023376','034481','06568C','156798','307DA6','4E92B4','71A8C4','94BED2','B3D1DF','D5E3E9','ECE5E0','EDD5C8','E4BFAA','DCAC90','D39774','CB835A','C37243','BA5E2A','A94512','942F06','7E1D06','6C0E07','590008'],
    50: ['001261','011A66','02226B','022B71','023376','023A7B','034280','034A85','06548B','0B5D91','136697','1E6F9D','2B79A4','3C85AC','4B90B3','5A9ABA','6AA4C1','7AAEC8','8DBAD0','9DC4D6','ADCDDD','BDD6E3','CCDFE8','DEE6E9','E8E7E5','EEE3DC','EEDBD0','EBD0C0','E7C6B2','E3BCA5','DFB298','DBA88B','D69D7C','D29470','CE8B64','CA8258','C6794C','C26E3F','BE6533','B85C28','B2511D','A94512','9C3709','912D06','872406','7E1D06','741506','6A0D07','620607','590008']
  }
}


exports.showPalettes = showPalettes
function showPalette(name, palette, opt_size, opt_discrete) {
  var size = opt_size ? opt_size : [100, 7]
  
  var width = size[0]

  if(typeof(opt_discrete != 'undefined') && opt_discrete) {
    var image = ee.Image.pixelCoordinates('EPSG:4326').select(0).divide(width/palette.length).floor()
      .clip(ee.Geometry.Rectangle({ coords: [[0, 0], size], geodesic: false }))
      .visualize({ min: 0, max: palette.length - 1, palette: palette })
  } else {
    var image = ee.Image.pixelCoordinates('EPSG:4326').select(0)
      .clip(ee.Geometry.Rectangle({ coords: [[0, 0], size], geodesic: false }))
      .visualize({ min: 0, max: width, palette: palette })
  }

  var label = ui.Label({ 
    value: name, 
    style: { width: '50px' } 
  })
  var thumb = ui.Thumbnail({ 
    image: image, 
    style: { width: '70%' } 
  })
  var panel = ui.Panel({ 
    widgets: [label, thumb], 
    layout: ui.Panel.Layout.flow('horizontal'), 
    style: { height: '50px' } 
  })
  print(panel)
}

exports.showPalette = showPalette
","users/gena/packages:text":"/*
Copyright (c) 2018 Gennadii Donchyts. All rights reserved.

This work is licensed under the terms of the MIT license.  
For a copy, see <https://opensource.org/licenses/MIT>.
*/

function draw(text, pos, scale, props) {
  text = ee.String(text)
  
  var ascii = {};
  for (var i = 32; i < 128; i++) {
      ascii[String.fromCharCode(i)] = i;
  }
  ascii = ee.Dictionary(ascii);
  
  var fontSize = '16';

  if(props && props.fontSize) {
    fontSize = props.fontSize
  }
  
  var fontType = \"Arial\"
  if(props && props.fontType) {
    fontType = props.fontType
  }
  
  var glyphs = ee.Image('users/gena/fonts/' + fontType + fontSize);

  if(props && props.resample) {
    glyphs = glyphs.resample(props.resample)
  }
  
  var proj = glyphs.projection();
  var s = ee.Number(1).divide(proj.nominalScale())
  
  // HACK: ee.Projection does not provide a way to query xscale, yscale, determing north direction manually
  var north = ee.Algorithms.If(proj.transform().index(\"-1.0\").gt(0), 1, -1)

  glyphs = glyphs.changeProj(proj, proj.scale(s, s.multiply(north)));
  
  // get font info
  var font = {
    height: ee.Number(glyphs.get('height')),
    width: ee.Number(glyphs.get('width')),
    cellHeight: ee.Number(glyphs.get('cell_height')),
    cellWidth: ee.Number(glyphs.get('cell_width')),
    charWidths: ee.String(glyphs.get('char_widths')).split(',').map(function (n) { return ee.Number.parse(n, 10) }),
  };
  
  font.columns = font.width.divide(font.cellWidth).floor();
  font.rows = font.height.divide(font.cellHeight).floor();
 
  function toAscii(text) {
    return ee.List(text.split('')
      .iterate(function(char, prev) { return ee.List(prev).add(ascii.get(char)); }, ee.List([])));
  }
  
  function moveChar(image, xmin, xmax, ymin, ymax, x, y) {
    var ll = ee.Image.pixelLonLat();
    var nxy = ll.floor().round().changeProj(ll.projection(), image.projection());
    var nx = nxy.select(0);
    var ny = nxy.select(1);
    var mask = nx.gte(xmin).and(nx.lt(xmax)).and(ny.gte(ymin)).and(ny.lt(ymax));
    
    return image.mask(mask).translate(ee.Number(xmin).multiply(-1).add(x), ee.Number(ymin).multiply(-1).subtract(y));
  }

  // TODO: workaround for missing chars
  text = text.replace('á', 'a')
  text = text.replace('é', 'e')
  text = text.replace('ó', 'o')

  var codes = toAscii(text);
  
  // compute width for every char
  var charWidths = codes.map(function(code) { return ee.Number(font.charWidths.get(ee.Number(code))); });

  var alignX = 0
  var alignY = 0
   
  if(props && props.alignX) {
    if(props.alignX === 'center') {
      alignX = ee.Number(charWidths.reduce(ee.Reducer.sum())).divide(2) 
    } else if(props.alignX === 'left') {
      alignX = 0 
    } else if(props.alignX === 'right') {
      alignX = ee.Number(charWidths.reduce(ee.Reducer.sum())) 
    }
  }

  if(props && props.alignY) {
    if(props.alignY === 'center') {
      alignY = ee.Number(font.cellHeight).divide(ee.Number(2).multiply(north)) 
    } else if(props.alignY === 'top') {
      alignY = 0 
    } else if(props.alignY === 'bottom') {
      alignY = ee.Number(font.cellHeight) 
    }
  }

  // compute xpos for every char
  var charX = ee.List(charWidths.iterate(function(w, list) { 
    list = ee.List(list);
    var lastX = ee.Number(list.get(-1));
    var x = lastX.add(w);
    
    return list.add(x);
  }, ee.List([0]))).slice(0, -1);
  
  var charPositions = charX.zip(ee.List.sequence(0, charX.size()));
  
  // compute char glyph positions
  var charGlyphPositions = codes.map(function(code) {
    code = ee.Number(code).subtract(32); // subtract start star (32)
    var y = code.divide(font.columns).floor().multiply(font.cellHeight);
    var x = code.mod(font.columns).multiply(font.cellWidth);
    
    return [x, y];
  });
  
  var charGlyphInfo = charGlyphPositions.zip(charWidths).zip(charPositions);
  
  pos = ee.Geometry(pos).transform(proj, scale).coordinates();
  var xpos = ee.Number(pos.get(0)).subtract(ee.Number(alignX).multiply(scale));
  var ypos = ee.Number(pos.get(1)).subtract(ee.Number(alignY).multiply(scale));

  // 'look-up' and draw char glyphs
  // var textImage = ee.ImageCollection(charGlyphInfo.map(function(o) {
  //   o = ee.List(o);
    
  //   var glyphInfo = ee.List(o.get(0));
  //   var gw = ee.Number(glyphInfo.get(1));
  //   var glyphPosition = ee.List(glyphInfo.get(0));
  //   var gx = ee.Number(glyphPosition.get(0));
  //   var gy = ee.Number(glyphPosition.get(1));
    
  //   var charPositions = ee.List(o.get(1));
  //   var x = ee.Number(charPositions.get(0));
  //   var i = ee.Number(charPositions.get(1));
    
  //   var glyph = moveChar(glyphs, gx, gx.add(gw), gy, gy.add(font.cellHeight), x, 0, proj);
  
  //   return glyph.changeProj(proj, proj.translate(xpos, ypos).scale(scale, scale));
  // })).mosaic();

  // textImage = textImage.mask(textImage)

  // >>>>>>>>>>> START WORKAROUND, 29.08.2020
  // EE backend DAG parsing logic has changed, some of map() nesting broke, 
  // ee.Geometry objects can't be used within the map() below, pass them using zip()  
  var positions = ee.List.repeat(xpos, charGlyphPositions.size()).zip(ee.List.repeat(ypos, charGlyphPositions.size()))
  charGlyphInfo = charGlyphInfo.zip(positions)

  // 'look-up' and draw char glyphs
  var charImages = ee.List(charGlyphInfo).map(function(o1) {
    o1 = ee.List(o1)
    
    var o = ee.List(o1.get(0));
    
    var xy = ee.List(o1.get(1));
    var xpos = ee.Number(xy.get(0))
    var ypos = ee.Number(xy.get(1))

    var glyphInfo = ee.List(o.get(0));
    var gw = ee.Number(glyphInfo.get(1));
    var glyphPosition = ee.List(glyphInfo.get(0));
    var gx = ee.Number(glyphPosition.get(0));
    var gy = ee.Number(glyphPosition.get(1));
    
    var charPositions = ee.List(o.get(1));
    var x = ee.Number(charPositions.get(0));
    var i = ee.Number(charPositions.get(1));
    
    var glyph = moveChar(glyphs, gx, gx.add(gw), gy, gy.add(font.cellHeight), x, 0, proj);
  
    return ee.Image(glyph).changeProj(proj, proj.translate(xpos, ypos).scale(scale, scale))
  })
  
  var textImage = ee.ImageCollection(charImages).mosaic();

  textImage = textImage.mask(textImage)
  // <<<<<<<< END WORKAROUND

  if(props) {
    props = { 
      textColor: props.textColor || 'ffffff', 
      outlineColor: props.outlineColor || '000000', 
      outlineWidth: props.outlineWidth || 0, 
      textOpacity: props.textOpacity || 0.9,
      textWidth: props.textWidth || 1, 
      outlineOpacity: props.outlineOpacity || 0.4 
    };

    var textLine = textImage
      .visualize({opacity:props.textOpacity, palette: [props.textColor], forceRgbOutput:true})
      
    if(props.textWidth > 1) {
      textLine.focal_max(props.textWidth)
    }

    if(!props || (props && !props.outlineWidth)) {
      return textLine;
    }

    var textOutline = textImage.focal_max(props.outlineWidth)
      .visualize({opacity:props.outlineOpacity, palette: [props.outlineColor], forceRgbOutput:true})

      
    return ee.ImageCollection.fromImages(ee.List([textOutline, textLine])).mosaic()
  } else {
    return textImage;
  }
}

/***
 * Annotates image, annotation info should be an array of:
 * 
 * { 
 *    position: 'left' | 'top' | 'right' | 'bottom',
 *    offset: <number>%,
 *    margin: <number>%,
 *    property: <image property name>
 *    format: <property format callback function>
 * }
 *  
 * offset is measured from left (for 'top' | 'bottom') or from top (for 'left' | 'right')
 * 
 * Example:
 * 
 * var annotations = [
 *  { 
 *    position: 'left', offset: '10%', margin: '5%',
 *    property: 'system:time_start', 
 *    format: function(o) { return ee.Date(o).format('YYYY-MM-dd') }
 *  },
 *  {
 *    position: 'top', offset: '50%', margin: '5%',
 *    property: 'SUN_AZIMUTH',
 *    format: function(o) { return ee.Number(o).format('%.1f degree') }
 *  }
 * ];
 * 
 * annotate(image, region, annotations);
 * 
 */
function annotateImage(image, vis, bounds, annotations) {
  // generate an image for every annotation
  var imagesText = annotations.map(function(annotation) {
    annotation.format = annotation.format || function(o) { return ee.String(o) }

    var scale = annotation.scale || Map.getScale()

    var pt = getLocation(bounds, annotation.position, annotation.offset, annotation.margin, scale)
    
    if(annotation.property) {
      var str = annotation.format(image.get(annotation.property))
      
      var textProperties = { fontSize: 14, fontType: 'Arial', textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6 }

      // set custom text properties, if any
      textProperties.fontSize = annotation.fontSize || textProperties.fontSize
      textProperties.fontType = annotation.fontType || textProperties.fontType
      textProperties.textColor = annotation.textColor || textProperties.textColor
      textProperties.outlineColor = annotation.outlineColor || textProperties.outlineColor
      textProperties.outlineWidth = annotation.outlineWidth || textProperties.outlineWidth
      textProperties.outlineOpacity = annotation.outlineOpacity || textProperties.outlineOpacity

      return draw(str, pt, annotation.scale || scale, textProperties)
    } 
  })
  
  var images = [image].concat(imagesText)

  if(vis) {
      images = [image.visualize(vis)].concat(imagesText)
  }
  
  return ee.ImageCollection.fromImages(images).mosaic()
}

/***
 * Returns size of the geometry bounds
 */
function getSize(g) {
  var p = g.projection()
  var coords = ee.List(ee.Geometry(g).bounds(1).transform(p, p.nominalScale()).coordinates().get(0))
  var ll = ee.List(coords.get(0))
  var ur = ee.List(coords.get(2))
  var ul = ee.List(coords.get(3))
  
  var height = ee.Number(ul.get(1)).subtract(ll.get(1))
  var width = ee.Number(ur.get(0)).subtract(ul.get(0))

  return { width: width, height: height }
}

/***
 * Computes a coordinate given positon as a text (left | right | top | bottom) and an offset in px or %
 */
function getLocation(bounds, position, offset, margin, scale) {
  var coords = ee.List(ee.Geometry(bounds).bounds(scale).coordinates().get(0))
  var ll = ee.List(coords.get(0))
  var ur = ee.List(coords.get(2))
  var ul = ee.List(coords.get(3))
  
  var height = ee.Number(ul.get(1)).subtract(ll.get(1))
  var width = ee.Number(ur.get(0)).subtract(ul.get(0))

  var offsetX = 0
  var offsetY = 0
  var pt = null;

  switch(position) {
    case 'left':
      pt = ee.Geometry.Point(ul)
      offsetX = offsetToValue(margin, width)
      offsetY = offsetToValue(offset, height).multiply(-1)
      break;
    case 'right':
      pt = ee.Geometry.Point(ur)
      offsetX = offsetToValue(margin, width).multiply(-1)
      offsetY = offsetToValue(offset, height).multiply(-1)
      break;
    case 'top':
      pt = ee.Geometry.Point(ul)
      offsetX = offsetToValue(offset, width)
      offsetY = offsetToValue(margin, height).multiply(-1)
      break;
    case 'bottom':
      pt = ee.Geometry.Point(ll)
      offsetX = offsetToValue(offset, width)
      offsetY = offsetToValue(margin, height)//.multiply(-1)
      break;
  }

  return translatePoint(pt, offsetX, offsetY)
}

/***
 * Converts <number>px | <number>% to a number value. 
 */
function offsetToValue(offset, range) {
  if(offset.match('px$')) {
    return ee.Number.parse(offset.substring(0, offset.length - 2))
  } else if(offset.match('%$')) {
    var offsetPercent = parseFloat(offset.substring(0, offset.length - 1))
    return ee.Number.parse(range).multiply(ee.Number(offsetPercent).divide(100))
  } else {
    throw 'Unknown value format: ' + offset
  }
}

function translatePoint(pt, x, y) {
  return ee.Geometry.Point(ee.Array(pt.coordinates()).add([x,y]).toList())
}

exports.draw = draw
exports.annotateImage = annotateImage
exports.getLocation = getLocation
exports.getSize = getSize
exports.translatePoint = translatePoint
"},"path":"users/jetolan-meta/forestmonitoring:canopyheight"}
