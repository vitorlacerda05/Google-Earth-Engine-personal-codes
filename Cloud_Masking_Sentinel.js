// This example uses the Sentinel-2 QA band to cloud mask
// the collection.  The Sentinel-2 cloud flags are less
// selective, so the collection is also pre-filtered by the
// CLOUDY_PIXEL_PERCENTAGE flag, to use only relatively
// cloud-free granule.

// Função que aplica Cloud Masking
function funcao(image) {
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
var collection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate('2016-01-01', '2016-12-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(funcao) //aplicou o Cloud Mask a partir do map, para o ImageCollection

var composite = collection.median() //pegou o mosaico

// Display the results.
Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3}, 'RGB')
