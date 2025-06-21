// ========= FUNÇÃO PRINCIPAL ===========
/* To-do: adicionar amplitude média dos setores ao clicar no mapa 
          adicionar o button de localização no painel */
function camada(parametrosCid,plotar,legend,chart){

  print('Cidade: ', parametrosCid.alvo)
  
  // ==========  Índice e estatísticas urbanas  =========== https://developers.google.com/earth-engine/tutorials/community/ph-ug-temp
  
  // select roi, date range, and landsat satellite
  var geometry = parametrosCid.geometria;
  var satellite = 'L8';
  var date_start = '2020-01-01';
  var date_end = '2020-12-31';
  var use_ndvi = true;

  // get landsat collection with added variables: NDVI, FVC, TPW, EM, LST
  var LandsatColl = LandsatLST.collection(satellite, date_start, date_end, geometry, use_ndvi)
  print(LandsatColl)

  var image = LandsatColl.select('LST')
                          .sort('CLOUD_COVER')
                          .first()
                            // .map(function(i){return i.gt(0)})
                        // .median()
                         .clip(geometry);
    
  // convert the brightness temperature (Kelvin 0.1) to Celsius 
  var tempC = image.subtract(273.15);
  
  // Temperaturas urbanas
  var urb_tempC = tempC.clip(parametrosCid.cs_urb.geometry().dissolve());
  
  // Visão Satelital RGB
  var urb_RGB = LandsatColl.select(['B4','B3','B2']).median().clip(parametrosCid.cs_urb.geometry().dissolve())
  // var params = urb_RGB.reduceRegion({reducer: ee.Reducer.percentile([5, 95]),scale: 30}).setOutputs(['min','max']);
  // print(params)
  // print(ee.List([params.B4_p5,params.B3_p5,params.B2_p5]).reduce(ee.Reducer.min()));

  // Média urbana
  var media_urb = urb_tempC.reduceRegion({
    reducer: ee.Reducer.mean(),
    scale: 30
  });
  
  // Percentis
  var percentile = urb_tempC.reduceRegion({
    reducer: ee.Reducer.percentile([5,25,75,95]),
    scale: 30
  });
  var getP5 = percentile.get('LST_p5')
  var p5 = ee.Number.parse(getP5).round()
  var getP25 = percentile.get('LST_p25')
  var p25 = ee.Number.parse(getP25).round()
  var getP75 = percentile.get('LST_p75')
  var p75 = ee.Number.parse(getP75).round()
  var getP95 = percentile.get('LST_p95')
  var p95 = ee.Number.parse(getP95).round()
  
  var med_urb = ee.Number(media_urb.get('LST')).round()
  
  // Desvio urbano em relação a média
  var desvUrb_min = p5.subtract(med_urb)
  var desvUrb_max = p95.subtract(med_urb)
  
  // Range (max - min)
  var range_urb = desvUrb_max.subtract(desvUrb_min)
  
  // print('min_urb:',min_urb, 'max_urb:',max_urb)
  print('desvUrb_min:',desvUrb_min, 'desvUrb_max:',desvUrb_max)
  print('MÉDIA URBANA:',med_urb, 'DESVIO URBANO:',range_urb)
  print('p5', p5, 'p25', p25, 'p75', p75, 'p95', p95)
  
  print('============================')
  
  // guarda uma cópia
  // var urb_tempC_abs = urb_tempC ;
  
  // Converter para amplitude
  var urb_tempC = urb_tempC.subtract(med_urb);
  
  // Geometrias de praças e areas verdes
  var pav = ee.FeatureCollection('users/edimilsonrodriguessantos/urbVerde/areasVerdes')
               .filter(ee.Filter.eq('CD_MUN', parametrosCid.municipio.get('CD_GEOCMU')))
               .map(function(f){return f.set('area-recalc', f.area())})
              .filter(ee.Filter.gte('area-recalc', 4000))
  Map.addLayer(pav,
                {'lineColor': '0000ffff', 'width': 2, 'lineType': 'solid', 'fillColor': null},
                'Praças e Áreas Verdes')
  
  var urb_tempC_pav = urb_tempC.clip(pav).rename('LST_pav');
  // print(urb_tempC_pav)
  
  //Junta as duas bandas (LST, LST_pav na mesma imagem)
  urb_tempC = urb_tempC.addBands(urb_tempC_pav);

  // //=========     Histograma ==================
  if (chart) {
    var hist = ui.Chart.image.histogram({
                    image: urb_tempC, 
                    region: parametrosCid.geometria, 
                    scale:30,
                    minBucketWidth:1,
                    maxBuckets:2*range_urb.getInfo(),
                    })
                  .setSeriesNames(['LST','LST_parques_e_areas_verdes'])
                  .setOptions({
                    title: 'Histograma de Desvios de Temperatura',
                    titleTextStyle: {align:'center'},
                    series: {
                      0: {targetAxisIndex: 0, type: 'bar', color: 'e37d05'},
                      1: {
                        targetAxisIndex: 1,
                        type: 'bar',
                        color: 'green',
                      },
                    },
                    hAxis: {
                      title: 'Desvio da Média de Temperatura Urbana(pixel=30m)',
                      titleTextStyle: {italic: false, bold: true},
                      // ticks: xticks,
                    },
                    vAxes: {
                            0: {
                              title: 'Contagem Global',
                              // viewwindow: {min: 0, max: 1600},
                              // ticks: [0, 500, 1000, 1500,2000],
                              titleTextStyle: {italic: false, bold: true, color: 'e37d05'}
                            },
                            1: {
                              title: 'Contagem Parques_e_Areas_Verdes',
                              // ticks: [0, 10, 20, 30, 40, 50, 60],
                              titleTextStyle: {italic: false, bold: true, color: 'green'}
                            }
                    }
                     });
    if (panel==false){
      print(hist)
    } 
  }
  
  //==========  Visualização do Plot e Legenda ==============
  if (plotar) {
    var imageVisParam = {
    "opacity":0.5,
    "bands":["LST"],
    "min":desvUrb_min.getInfo(),
    "max":desvUrb_max.getInfo(),
    "palette": ['blue', 'limegreen', 'yellow', 'darkorange', 'red']}

    // Paint the interior of the polygons with different colors.
    // var empty1 = ee.Image().byte();
    // var fills = empty1.paint({
    //   featureCollection: multiStats,
    //   color: 'mean',
    // });
    
    // var fills_praça = empty1.paint({
    //   featureCollection: multiStats_pav,
    //   color: 'mean',
    // });
    
    var empty2 = ee.Image().byte();
    var contorno_setores = empty2.paint({
      featureCollection: setores,
      color: 1,
      width: 2,
    });
    
    // Map.addLayer(fills, {palette: ['blue', 'limegreen', 'yellow', 'darkorange', 'red'],min:desvUrb_min.getInfo(),max:desvUrb_max.getInfo()},
    //               'Tm Setor', false); 
    // Map.addLayer(fills, {palette: ['blue', 'limegreen', 'yellow', 'darkorange', 'red'],min:desvUrb_min.getInfo(),max:desvUrb_max.getInfo()},
    //               'Tm Praças', false); 
    Map.addLayer(contorno_setores.clip(parametrosCid.cs_urb),{palette:'white',opacity: 0.7},'Setores Censitários - urbano')
    // Map.addLayer(urb_tempC_abs,{}, 'Absoluta Temp (ºC)', false);
    Map.addLayer(urb_tempC,imageVisParam, 'Desvio Temp (ºC)');
    print(image)
    Map.addLayer(urb_RGB,{bands:['B4','B3','B2']}, 'Espectro Visível Satélite RGB',false);
      // min: ee.List([params.B4_p5,params.B3_p5,params.B2_p5]).reduce(ee.Reducer.min()),
      // max: ee.List([params.B4_p95,params.B3_p95,params.B2_p95]).reduce(ee.Reducer.max()),
    
    Map.centerObject(parametrosCid.cs_urb.geometry(), 13);
    Map.setOptions('SATELLITE');
    
    // LEGENDA 
    if (legend) {
      
      function legendar(){

          var legendPanel_wth = ui.Panel({style: {width: '160px', 
                                                  position: 'bottom-right'}});
            
          var VIS_WTH = {'min': imageVisParam.min,
                         'max': imageVisParam.max,
                         'palette': imageVisParam.palette,
                         'range':imageVisParam.max-imageVisParam.min,
                        };
          
          // function makeLegendImage(VIS) {
          //   var lon = 
          //   var gradient = lon //.multiply((VIS.max-VIS.min)/100).add(VIS.min);
          //   var legendImage = gradient //.visualize(VIS);
          //   return legendImage;
          // }

          var colorBar_wth = ui.Thumbnail({
            image: ee.Image.pixelLonLat().select('latitude').int(),
            params: {bbox: [VIS_WTH.range, 0, 0, VIS_WTH.range+1], 
                     dimensions: '25x149',
                     min:0,
                     max:imageVisParam.max-imageVisParam.min,
                     palette: VIS_WTH.palette,
            },
            style: {stretch: 'vertical', margin: '6px 14px'},
          });
          
          var legendLabels = [];
          for(var i=imageVisParam.max; i >=imageVisParam.min; i--) {
            var j = i;
            if (i>0){
              var j = "+"+i;
              if (i==imageVisParam.max) {
                var j = j+"⠀⠀⠀⠀🔥 "
                
              } 
            } else if (i==0){
                var j = i+'   (Média)'
            } else if (i==imageVisParam.min){
                var j = i+"⠀⠀⠀⠀❄️ "
            }
            
            legendLabels.push(ui.Label(j, {margin: '4px 0px'}));
          }
            
          var legendLabels_wth = ui.Panel({
            widgets: legendLabels,
            layout: ui.Panel.Layout.flow('vertical'),
          });
            
          var legendTitle_wth = ui.Label({value: 'Desvio da Média das Temperaturas de Superfície* Urbanas em ºC', style: {fontWeight: 'bold'}});
          legendPanel_wth.add(ui.Panel(legendTitle_wth));
          
          
          legendPanel_wth.add(ui.Label({value:'(🥵 Ilha de Calor )'}));
          legendPanel_wth.add(ui.Panel([colorBar_wth, legendLabels_wth], ui.Panel.Layout.flow('horizontal')));
          // legendPanel_wth.add(ui.Panel([colorBar_wth], ui.Panel.Layout.flow('horizontal')));
          legendPanel_wth.add(ui.Label({value:'(😊 Ilha de Frescor)'}));
          legendPanel_wth.add(ui.Label({
            value: '🏝️️‍Valores (+) indicam intensidade das ilhas de calor de superficie*. Os (-)  ilhas de frescor.',
            style: {'fontSize':'12px'}}));
          
            
          Map.add(legendPanel_wth)
        }
      legendar()  
    }
    
  }
  
  
  // ======== PAINEL =========
  var painel=true
  if (painel){
      function panel(){
      
      var inspectorPanel = ui.Panel({style: {width: '20%'}});
      
      inspectorPanel.add(ui.Panel([
        ui.Label({
          value: '🌎 Camada de 🛰️ Temperaturas de Superfície* Terrestre ',
          style: {textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '14px 14px'}
        }),
        ui.Label({
          value:'🚀v1.5',
          style: {margin: '0px 90px'}
        }),
      ]));
        
      // == BUTTON CIDADE ==
      // Lista de municípios
      var alvoSelect = municipios_sp.aggregate_array('NM_MUNICIP').distinct().sort()
      
      var select = ui.Select({
        items: alvoSelect.getInfo(), 
        value: alvoSelect[0],
        onChange: function(key) {
          
          Map.clear() //limpa o mapa anterior
          // inspectorPanel.clear()
          ui.root.remove(inspectorPanel)
          // inspectorPanel.remove(select) //remove o antigo button
          // inspectorPanel.remove(viewPanel) //remove o antigo slider
          // inspectorPanel.remove(pointText)
          
          var parametrosCid = mun(municipios_sp.filterMetadata('NM_MUNICIP','equals',key).first().get('NM_MUNICIP'))
          camada(parametrosCid,plotar,legendar,chart)
          Map.centerObject(parametrosCid.cs_urb.geometry(),13)
        },
        style: {textAlign: 'center', margin: '12px 18px'}
      });
  
      //Adicionar o button de localização no painel
      select.setPlaceholder('Escolha outra cidade');
      select.style().set({width: '190px'})
      inspectorPanel.add(select)
      
      
      // == SLIDER OPACIDADE ==
      var opacitySlider = ui.Slider({
        min: 0,
        max: 1,
        value: 0.5,
        step: 0.01,
        style: {margin: '12px 5px'}
      });
      opacitySlider.onChange(function(value) {
      Map.layers().get(3).setOpacity(value); //3 é o ID da camada do Map.layers()
      });       
      opacitySlider.style().set({width: '120px'})
      
      var opacityLabel = ui.Label({
          value: 'Opacidade:',
          style: {textAlign: 'center', margin: '12px 18px'}
        })
      
      var viewPanel = ui.Panel([opacityLabel, opacitySlider], ui.Panel.Layout.Flow('horizontal'));
      inspectorPanel.add(viewPanel);
      
      // == DESVIO AO CLICAR NO MAPA ==
      var pointText = ui.Label({
        value: '🖱️ Clique no mapa para medir',
        style: {fontWeight: 'bold', margin: '12px 18px'}
      })
      inspectorPanel.add(pointText)
  
      //Adicionar desvio médio dos setores ao clicar no mapa 
      Map.style().set('cursor', 'crosshair');
      
      Map.onClick(function(coords) {
        var point = ee.Geometry.Point(coords.lon, coords.lat);
        var temp = urb_tempC.reduceRegion(ee.Reducer.first(), point, 30).evaluate(function(val){
          // var tempRound = ee.Number(temp.get('LST')).round()  
          var tempText = '🖱️ Medida no ponto: ' + val.LST.toFixed(2) + 'ºC';
          inspectorPanel.widgets().set(3, ui.Label({value: tempText,style: {fontWeight: 'bold', margin: '12px 18px'}}));
          });
        // inspectorPanel.widgets().set(1, ui.Label(location));
        inspectorPanel.widgets().set(3, ui.Label({value: '🖱️ Medida no ponto: ...',style: {fontWeight: 'bold', margin: '12px 18px'}}));
        Map.layers().set(4, ui.Map.Layer(point, {color: 'black'}, 'Ponto de Interesse')); //4 é a ultima layer (para substituir uma layer que não "existe")
      });
          // )
      // });
      
      // Replace the root with a Pannel that contains the inspector and map.
       // Create an intro panel with labels.
      inspectorPanel.add(hist);
      
      var intro = ui.Panel([
        ui.Label({
          value:'Os contornos em branco refletem a classificação de área urbana dos setores censitários do censo 2010(IBGE). Os dados de temperatura de superficie* provêm do satélite LANDSAT-8 ao longo do ano de 2020 (resolução espacial 30m/pixel).  Metodologia adaptadade Ermida et. al (2020) e reproduzida para todos municípios de SP. Disponível em:',
          style: {margin: '12px 18px', }
        }),
        ui.Label({
          value:'https://code.earthengine.google.com/?accept_repo=users/sofiaermida/landsat_smw_lst',
          style: {margin: '0px 18px'}
        }).setUrl('https://code.earthengine.google.com/?accept_repo=users/sofiaermida/landsat_smw_lst'),
      ]);
      inspectorPanel.add(intro);
      
      ui.root.insert(0, inspectorPanel)
    }
  }
  panel()
}



// ======== INICIAR CÓDIGO ========= 

//Pega os módulos desenvolvidos por Ermida et. al(2018)
var LandsatLST = require('users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js');

//Carrega setores censitários de 2010 marcados como área urbana e rural
function mun(cidade){
  var alvo = cidade;
  
  var municipio = municipios_sp.filterMetadata('NM_MUNICIP','equals',alvo).first();

  //Selecionando o municipio (senão São Carlos) pelo código IBGE (CD_GEOCMU: 3548906)
  var cs = setores.filterMetadata('CD_GEODM','equals',municipio.get('CD_GEOCMU'));

  //Separando setores urbanos (IBGE 2010)
  var cs_urb = cs.filterMetadata('TIPO','equals','URBANO');
  
  var munObj = {alvo: alvo, municipio: municipio, cs: cs, cs_urb: cs_urb, geometria: municipio.geometry()};
  return munObj
}

//Pega parametros da cidade e roda função principal "camada"
var parametrosCid = mun(municipios_sp.filterMetadata('NM_MUNICIP','equals','GARÇA'). first().get('NM_MUNICIP'))
var plotar=true
var legend=true
var chart=true
camada(parametrosCid,plotar,legend,chart)