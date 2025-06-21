//Image Collection
var col = ee.ImageCollection("COPERNICUS/S2")

//Feature Collection
var setor = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")

//Filtro do Feature Collection e transformei em geometry
var setor_br = setor.filter(ee.Filter.eq('ADM2_NAME', 'Caconde'))

//Filtro do Image Collection já com mosaico e já clippado
var filtro = col.filter(ee.Filter.date('2021-01-01','2021-12-01'))
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                .filter(ee.Filter.bounds(setor_br))
                .median() //mosaico
                .clip(setor_br) //clipar na área desejada
                
//Propriedade Vis do Map.addLayer
var vis = {
  min: 0.0,
  max: 3000,
  bands: ['B4', 'B3', 'B2'], 
};

//Template setor transparente
  var img_vazia = ee.Image().byte();
  var contorno_setores = img_vazia.paint({
    featureCollection: setor_br,
    color: 0,
    width: 2
  });
Map.addLayer(contorno_setores,{palette:'blue'},'Setores Censitários')

//Adicionar ao mapa
Map.addLayer(filtro, vis, 'Mapa_br')