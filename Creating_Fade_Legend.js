var s2 = ee.ImageCollection("COPERNICUS/S2");
var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");

var bangalore = admin2.filter(ee.Filter.eq('ADM2_NAME', 'Bangalore Urban'))
var geometry = bangalore.geometry() 

var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2019-01-01', '2019-12-31'))
  .filter(ee.Filter.bounds(geometry))

var image = filtered.median(); 

// Calculate  Normalized Difference Vegetation Index (NDVI)
// 'NIR' (B8) and 'RED' (B4)
var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);

var palette = ['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641']
var ndviVis = {min:0, max:0.5, palette: palette}
Map.centerObject(geometry, 12)
Map.addLayer(ndvi.clip(geometry), ndviVis, 'ndvi')


function createColorBar(titleText, palette, min, max) {
  // Legend Title
  var title = ui.Label({
    value: titleText, 
    style: {fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal'}});

  // Colorbar
  var legend = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '200x20',
      format: 'png', 
      min: 0, max: 1,
      palette: palette},
    style: {stretch: 'horizontal', margin: '8px 8px', maxHeight: '40px'},
  });
  
  // Legend Labels
  var labels = ui.Panel({
    widgets: [
      ui.Label(min, {margin: '4px 10px',textAlign: 'left', stretch: 'horizontal'}),
      ui.Label((min+max)/2, {margin: '4px 20px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(max, {margin: '4px 10px',textAlign: 'right', stretch: 'horizontal'})],
    layout: ui.Panel.Layout.flow('horizontal')});
  
  // Create a panel with all 3 widgets
  var legendPanel = ui.Panel({
    widgets: [title, legend, labels],
    style: {position: 'bottom-center', padding: '8px 15px'}
  })
  return legendPanel
}
// Call the function to create a colorbar legend  
var colorBar = createColorBar('NDVI Values', palette, 0, 0.5)

Map.add(colorBar)
