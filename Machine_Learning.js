//ImageCollection 
var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
var urbanAreas = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")
var city = urbanAreas.filter(ee.Filter.eq('ADM2_NAME', 'Caconde'))
var geometry = city.geometry()
Map.centerObject(geometry, 13)

var topografia = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2") //calculo altura
var topografia = topografia.median().clip(geometry)

//--------------------------- Cloud Masking ----------------------------------

// Função que aplica Cloud Masking
function cloudmasking(image) {
  var qa = image.select('QA60')

  // Selecionou o intervalo de bits das Clouds e Cirrus
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Indicou que ambos tem que ser igual a 0
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0))

  // Retornou os dados masked
  return image.updateMask(mask).divide(10000)
      .select("B.*")
      .copyProperties(image, ["system:time_start"])
}

//PARA APLICAR CLOUD MASKING:
//Uso .map(funcao) e faço o mosaico
//Filtro e chamada da função Cloud Masking

//----------------------------------------------------------------------------

//Filtro e seleção de todas as bandas
var filtered = s2
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .filter(ee.Filter.date('2019-01-01', '2019-12-31'))
  .filter(ee.Filter.bounds(geometry))
  .map(cloudmasking)
  .select('B.*')

//Mosaico e clip
var mosaico = filtered.median().clip(geometry)
var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2']};

//------------------------------ Índices -------------------------------------

var addIndices = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename(['ndbi']);
  var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 
  var bsi = image.expression(
      '(( X + Y ) - (A + B)) /(( X + Y ) + (A + B)) ', {
        'X': image.select('B11'), //swir1
        'Y': image.select('B4'),  //red
        'A': image.select('B8'), // nir
        'B': image.select('B2'), // blue
  }).rename('bsi');
  return image.addBands(ndvi).addBands(ndbi).addBands(mndwi).addBands(bsi)
}

//----------------------------------------------------------------------------

var mosaico = addIndices(mosaico);

// ---------------------------- Altura 1 -------------------------------------

//Calcular declive (slope) e elevação (elevation)
var elevacao = topografia.select('DSM').rename('elevacao');
var declive = ee.Terrain.slope(topografia.select('DSM')).rename('declive');

// ------------------------- Classificadores ----------------------------------

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

// ---------------------------- Altura 2 -------------------------------------

//retorna composite com bandas adicionadas relacionadas a elevação e declive
var mosaico = mosaico.addBands(elevacao).addBands(declive);

//------------------------- Reduce e print -----------------------------------

var statsIndice = mosaico.select('bsi', 'mndwi', 'ndbi', 'ndvi')
var indices = statsIndice.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: geometry,
  scale: 100,
  maxPixels: 1e10
})
print(indices, 'Índices')

var statsAltura = mosaico.select('elevacao', 'declive')
var indices = statsAltura.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 100,
  maxPixels: 1e10
})
print(indices, 'Altura')

//---------------------------------------------------------------------------

//VIS do NDVI
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];
var vis = {
  min: 0.0,
  max: 1.0,
  palette: palette,
  bands: ['ndvi']
}

Map.addLayer(mosaico, vis, 'ndvi') //ndvi
Map.addLayer(topografia, {bands: ['DSM'], min: 732, max: 1187}, 'Topografia') //topografia
Map.addLayer(mosaico, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3}, 'RGB') //mosaico
Map.addLayer(classificar, {min: 0, max: 3, palette: ['gray', 'brown', 'blue', 'green']}, '2019'); //classificar

