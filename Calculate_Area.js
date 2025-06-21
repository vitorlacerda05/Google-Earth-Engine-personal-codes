//ImageCollection 
var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
var urbanAreas = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")
var city = urbanAreas.filter(ee.Filter.eq('ADM2_NAME', 'Caconde'))
var geometry = city.geometry()
Map.centerObject(geometry, 13)

//Filtro e seleção de todas as bandas
var filtered = s2
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2019-01-01', '2019-12-31'))
  .filter(ee.Filter.bounds(geometry))
  .select('B.*')

//Mosaico e clip
var mosaico = filtered.median().clip(geometry) 

var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2']};
Map.addLayer(mosaico, rgbVis, 'image');

//Mesclar para criar apenas uma feature com todos
var gcps = urbano.merge(nu).merge(agua).merge(vegetacao);

//Obter dados com sampleRegions
var dados = mosaico.sampleRegions ({
  collection: gcps,
  properties: ['landcover'],
  scale: 5,
  tileScale: 16
});
print(dados, 'Dados');

//Criar o classificador
var classificador = ee.Classifier.smileRandomForest(10).train({
  features: dados,
  classProperty: 'landcover',
  inputProperties: mosaico.bandNames()
});

//Classificar e colocar no mapa
var classificar = mosaico.classify(classificador);
Map.addLayer(classificar, {min: 0, max: 3, palette: ['gray', 'brown', 'blue', 'green']}, '2019'); 

//----------------------- Calculo de área --------------------------------

//Calculo da área de uma feature collection
var areaTotal = geometry.area()
var areaTotalKm2 = ee.Number(areaTotal).divide(1e6).round()
print (areaTotalKm2, 'Área total do município')

//Calculo da área de uma image
var veg = classificar.eq(3);
var areaPixel = veg.multiply(ee.Image.pixelArea())

Map.addLayer(veg, {min: 0, max: 1, palette: ['white', 'green']}, 'Locais com vegetação')

var areaVeg = areaPixel.reduceRegion({
  reducer: ee.Reducer.sum(), 
  geometry: geometry, 
  scale: 10, 
  maxPixels: 1e10
  })

var areaVegKm2 = ee.Number(areaVeg.get('classification')).divide(1e6).round()
print (areaVeg, 'Área vegetação')
