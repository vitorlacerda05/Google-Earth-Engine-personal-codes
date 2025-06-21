//Importações e partes iniciais
var col = ee.ImageCollection("COPERNICUS/S2")
var setor = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")
var setor_br = setor.filter(ee.Filter.eq('ADM2_NAME', 'Caconde'))
Map.centerObject(setor_br, 12)

//Filtro, ainda não é um mosaico (possui várias imagens, não apenas uma)
var filtro = col.filter(ee.Filter.date('2021-01-01','2021-12-01'))
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                .filter(ee.Filter.bounds(setor_br))

//---------------------- Função para calcular índices ----------------------------

//Função que entra image e retorna image, dentro dela coloco a banda e os índices
var funcao = function(image) {
  
  //var do NDVI (indice 1)
  var ndvi = image.normalizedDifference(['B8','B4']); //função do ndvi
  image = image.addBands(ndvi.rename('ndvi')); //para renomear e retornar as bandas
  
  //var do EVI (indice 2)
  var evi = image.expression(
    '2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)',
    {
        red: image.select('B4'),
        nir: image.select('B8'), 
        blue: image.select('B2')
    });
    image = image.addBands(evi.rename('evi'));
    
  return image;
}

//--------------------------------------------------------------------------------

//Para aplicar o .map no filtro, chamando a função
var map_filtro = filtro.map(funcao)

//Para aplicar o mosaico no filtro com map
var mosaico_map_filtro = map_filtro.median()

//Propriedade Vis do Map.addLayer
var vis = {
  min: 0.0,
  max: 3000,
  bands: ['B4', 'B3', 'B2'], 
};


//Propriedade Vis dos índices
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];

var vis_ndvi = {
  min: 0.0,
  max: 1.0,
  palette: palette,
  bands: ['ndvi']
}

var vis_evi = {
  min: 0.0,
  max: 1.0,
  palette: palette,
  bands: ['evi']
}

/*Map.addLayer
  tive que chamar o filtro com mosaico e map, poderia, ao invés de fazer várias funções, colocar
  Map.addLayer(filtro.map(funcao).median().clip(setor_br), vis_ndvi, 'NDVI'); */
Map.addLayer(mosaico_map_filtro.clip(setor_br), vis_ndvi, 'NDVI');
Map.addLayer(mosaico_map_filtro.clip(setor_br), vis_evi, 'EVI');
  //Para este, coloquei apenas o median(), já que não usou o NDVI, portanto não usa map()
Map.addLayer(filtro.median().clip(setor_br), vis, 'Mapa')
