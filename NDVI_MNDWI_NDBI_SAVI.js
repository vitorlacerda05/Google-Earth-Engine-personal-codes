//Image Collection
var col = ee.ImageCollection("COPERNICUS/S2")

//Feature Collection
var setor = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")

//Filtro do Feature Collection e transformei em geometry
var setor_br = setor.filter(ee.Filter.eq('ADM2_NAME', 'Caconde'))

Map.centerObject(setor_br, 12) //centrar a imagem no featurecollection

//Filtro do Image Collection já com mosaico e já clippado
var filtro = col.filter(ee.Filter.date('2021-01-01','2021-12-01'))
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                .filter(ee.Filter.bounds(setor_br))
                .median() //mosaico

//-------------------------- Índices --------------------------------

//NDVI
//'NIR' (B8) and 'RED' (B4)
var ndvi1 = filtro.normalizedDifference(['B8','B4']).rename('ndvi')

var ndvi2 = filtro.expression(
  '(NIR - RED)/(NIR + RED)',{
    'NIR': filtro.select('B8'),
    'RED': filtro.select('B4')
  }).rename('ndvi2')

//MNDWI
//'GREEN' (B3) and 'SWIR1' (B11)
var mndwi = filtro.normalizedDifference(['B3', 'B11']).rename('mndwi')

//SAVI
//1.5 * ((NIR - RED) / (NIR + RED + 0.5)) e reflectance
var savi = filtro.expression(
  '1.5 * ((NIR - RED) / (NIR + RED + 0.5))', {
    'NIR': filtro.select('B8').multiply(0.0001),
    'RED': filtro.select('B4').multiply(0.0001)
  }).rename('savi')

//NBDI
var ndbi = filtro.expression(
  '(SWIR1-NIR)/(SWIR1+NIR)',{
    'SWIR1':filtro.select('B11'),
    'NIR':filtro.select('B8')
  }).rename('ndbi')

//-------------------------------------------------------------------

//Propriedade Vis do Map.addLayer da imagem normal e dos índices
var vis = {
  min: 0.0,
  max: 3000,
  bands: ['B4', 'B3', 'B2'], 
};

var vis_ndvi = {min:0, max:1, palette: ['white', 'green']}

var vis_mndwi = {min:0, max:0.5, palette: ['white', 'blue']}

var vis_nbdi = {min:0, max:1, palette: ['white', 'red']}

//Template setor transparente
  var img_vazia = ee.Image().byte();
  var contorno_setores = img_vazia.paint({
    featureCollection: setor_br,
    color: 0,
    width: 4
  });
Map.addLayer(contorno_setores,{palette:'blue'},'Setores Censitários')

//Adicionar ao mapa
Map.addLayer(ndvi1.clip(setor_br), vis_ndvi, 'NDVI 1')
Map.addLayer(ndvi2.clip(setor_br), vis_ndvi, 'NDVI 2')
Map.addLayer(mndwi.clip(setor_br), vis_mndwi, 'MNDWI')
Map.addLayer(savi.clip(setor_br), vis_ndvi, 'SAVI')
Map.addLayer(filtro.clip(setor_br), vis, 'Mapa')
Map.addLayer(ndbi.clip(setor_br), vis_nbdi, 'NDBI')