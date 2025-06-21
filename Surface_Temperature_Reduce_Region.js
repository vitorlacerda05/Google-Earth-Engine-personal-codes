
var lista_anos = [/*2016,2017,2018,*/2019,2020]

// Centralizando em São Carlos
//Map.centerObject(estado_sp);

setores = setores.filterMetadata('CD_GEODM','EQUALS','3500105')
var table = ee.List([])

Map.addLayer(setores)
print(setores)
//Map.centerObject(setores)

// ==== NDVI MÉDIO ====
var ndvi_medio = function (feicao,ndvi){
  //Cálculo do NDVI médio no Setor selecionado
  var setor_alvo = ndvi.clip(feicao).reduce(ee.Reducer.mean())
  var ndvi_medio = setor_alvo.reduceRegion(ee.Reducer.mean(),feicao, 30);
      ndvi_medio = ndvi_medio.get('mean')

    return ndvi_medio
}

// ==== MLME MÉDIO ====
var fracao_media = function (feicao, fracao){
  //Cálculo da Média do MLME no setor selecionado
  var setor_alvo_mlme = fracao.clip(feicao).reduce(ee.Reducer.mean())
  var media_mlme  = setor_alvo_mlme.reduceRegion(ee.Reducer.mean(),feicao, 30);
      media_mlme = media_mlme.get('mean')
  
  return media_mlme
}



var indexes = function(ano){
  var feicao = estado_sp
  
  //============NDVI===========
  //Estrutura Básica NDVI utilizando bandas com resolução de 10m 
  // NDVI = (NIR - RED) / (NIR + RED), onde B4=RED e B8=NIR
  var data_inicial  = ano + '-01-01'
  var data_final = ano + '-12-31'
  
  var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
                        .filterDate(data_inicial,data_final )
                        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                        .min();
                        
  var img = ee.Image(sentinel2);
  
  //normalizedDifference (NIR,RED) = (NIR - RED) / (NIR + RED)
  var ndvi = img.normalizedDifference(['B8', 'B4']).clip(feicao);
  ndvi = ndvi.rename(['ndvi_'+ ano])
  
  // Paleta de cores em Hexa.
  var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
                 '74A901', '66A000', '529400', '3E8601', '207401', '056201',
                 '004C00', '023B01', '012E01', '011D01', '011301'];
  
  
  //============MLME============
  var start = data_inicial;
  var end = data_final;
  
  //Cloud Mask
  var maskL8 = function(image) {
    var qa = image.select('BQA');
    /// Check that the cloud bit is off.
    // See https://www.usgs.gov/land-resources/nli/landsat/landsat-collection-1-level-1-quality-assessment-band
    var mask = qa.bitwiseAnd(1 << 4).not()
                 //.and(qa.bitwiseAnd(1<<7).eq(0).or(qa.bitwiseAnd(1<<8).eq(0)))
                 
    return image.updateMask(mask);
  }
  
  //Examinando Landsat 8 da area
  var L8_img = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
        .filterBounds(feicao)
        .filterDate(start, end)
        .map(maskL8)
        .median()
        .clip(estado_sp)
        .select(['B2','B3','B4','B5','B6','B7'],['B1','B2','B3','B4','B5','B7'])
  
  // Criando uma Coleção com Lista de Imagens Landsat
  var mosaic = ee.ImageCollection(L8_img)
      .select(['B1','B2','B3','B4','B5','B7'], ['B1','B2','B3','B4','B5','B6']);
  
  var trueColor = {
    bands: ['B3', 'B2', 'B1'],
    min:0.05,
    max:0.2,
    gamma: [0.8, 1.1, 1]
  };
  
  // MODELO LINEAR DE MISTURA ESPECTRAL
  // Definindo os "endmenbers"  (global endmembers by Small & Millesi)
  var substrate = [0.211200, 0.317455, 0.426777, 0.525177, 0.623311, 0.570544];
  var veg =       [0.093026, 0.086723, 0.049961, 0.611243, 0.219628, 0.079601];
  var dark =      [0.081085, 0.044215, 0.025971, 0.017209, 0.004792, 0.002684];
  
  
  // Função para aplicar o MLME no conjunto de imagens Landsat Filtrado na região
  var addUnmix = function(mosaic) {
    var unmix = mosaic.unmix([substrate, veg, dark], true, true).rename('sub_' + ano, 'veg_' + ano, 'dark_' + ano);
    
    return mosaic.addBands(unmix);
  };
  
  // Mapeia a função unmix e retorna uma lista
  var unmixed = mosaic.map(addUnmix);
      unmixed = ee.ImageCollection(unmixed)
                .select(['veg_' + ano]).min().clip(feicao);
  
  // Parâmetros Visuais  LSU
  var vizuParams = {
    bands: ['veg'],
    min: 0,
    max: 1,
    gamma: [1.5]
  };
  
var indexes = unmixed.addBands(ndvi)

  print('setores',setores)
  var mean_index = setores.map(function(f){
                   var id = f.get('CD_GEODI')
                   var ndvi_setor = ndvi_medio(f,indexes.select('ndvi_'+ano))
                   var veg_setor = fracao_media(f,indexes.select('veg_'+ano))
                   //print(id,ndvi_setor,veg_setor)
                   var tableColumns = ee.Feature(null)
                                                   .set("id_setor", id)
                                                   .set("ndvi_" + ano, ndvi_setor)
                                                   .set("veg_" + ano, veg_setor)  
  
  return table.add(tableColumns) 
  })

  //LAYERS

  //Map.addLayer(mosaic,trueColor,'Landsat')  
  //Map.addLayer(unmixed,vizuParams,'MLME')
  //Map.addLayer(ndvi, {min: 0, max: 1, palette: palette}, 'NDVI')

  //============Densidade Populacional==================


  return table
}


var index_table = lista_anos.map(indexes)
print('table', index_table)




//=====Exporta o mosaico como asset=======
Export.table.toDrive({
  collection: ee.FeatureCollection(table).flatten(), 
  description:"mean_index", 
  folder:'GEE-EXPORT', 
  fileFormat:'CSV'
})

//var densidade = setores.reduceToImage(['densidade'],ee.Reducer.median())
//  densidade = densidade.rename(['densidade_km'])
//  
//  print ("Densidade_Populacional", densidade)
//  

