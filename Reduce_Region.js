var geometry = ee.Geometry.Point([77.60412933051538, 12.952912912328241])
var s2 = ee.ImageCollection("COPERNICUS/S2");
    
//Gerando valores para a lista
var myList = ee.List.sequence(1, 10);
print(myList)

//Usar reducer pra calcular máximo e mínimo de uma lista
var mean = myList.reduce(ee.Reducer.minMax());
print(mean, 'Minimo e máximo da Lista');


//Filtro do Image Collection
var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2019-01-01', '2020-01-01'))
  .filter(ee.Filter.bounds(geometry))
  .select('B.*') //selecionei a banda que quero aplicar o reduce

//Aplicar para Image Collection
print(filtered.size(), 'Quantidade de imagens do filtro')
var collMean = filtered.reduce(ee.Reducer.mean()); //reducer que pega a média da banda
print('Reducer na coleção', collMean);

//Peguei a primeira imagem do ImageCollection
var image = ee.Image(filtered.first())

//Aplicar para Image
//Se eu quero calcular reduce para todas as bandas de uma imagem,
//Posso usar reduceRegion:
var stats = image.reduceRegion({
  reducer: ee.Reducer.mean(), //vou calcular a média de cada banda da imagem
  geometry: image.geometry(),
  scale: 100,
  maxPixels: 1e10
  })
print(stats, 'Reducers das várias bandas de uma imagem');

// O Resultado do reduceRegion é um objeto (dicionário) 
// Então, extraio valor usando .get('banda_que_quero')
print('Average value in B4', stats.get('B4'))

