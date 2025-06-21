//--------------------- Função que calcula NDVI ------------------------------

var funcao = function(image){
  var ndvi = image.normalizedDifference(['B5', 'B4'])
  image = image.addBands(ndvi.rename('ndvi'))
  return image
}
//----------------------------------------------------------------------------

var col = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");

//Setores
var setor_urban = ee.FeatureCollection("users/breno_malheiros/Censo2010-SP")
                  .filter(ee.Filter.eq('CD_GEODM', '3548906'))
                  .filter(ee.Filter.eq('TIPO', 'URBANO'));
Map.centerObject(setor_urban, 12);

//Filtro do ImageCollection e NDVI
var filter = col.filter(ee.Filter.date('2021-01-01', '2021-12-01'))
                .filter(ee.Filter.bounds(setor_urban))
                .filter(ee.Filter.lt('CLOUD_COVER', 30))

var ndvi = filter.map(funcao).median()  //NDVI para demonstrar no mapa
var ndvi_chart = filter.map(funcao)     //NDVI para o gráfico, sem ser mosaico

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

//Feature Collections
  // Cria uma imagem vazia na qual pintar os poligonos, convertendo em byte. 
  var img_vazia = ee.Image().byte();
  // Pinta todas as bordas do polígono com o mesmo número e largura.
  var contorno_setores = img_vazia.paint({
    featureCollection: setor_urban,
    color: 0,
    width: 2
  });
  
Map.addLayer(contorno_setores,{palette:'blue'},'Setores Censitários')
Map.addLayer(ndvi.clip(setor_urban), vis, 'NDVI')

//Construção do gráfico
var chart = ui.Chart.image.series({
  imageCollection: ndvi_chart.select('ndvi'),
  region: setor_urban,
  reducer: ee.Reducer.mean(),
  scale: 20
  }).setOptions({
    lineWidth: 1,
    title: 'NDVI Time Series',
    interpolateNulls: true,
    vAxis: {title: 'NDVI'},
    hAxis: {title: '', format: 'YYYY-MMM'}
  })

print(chart)