var classified = ee.Image("users/ujavalgandhi/e2e/bangalore_classified")
Map.centerObject(classified)
Map.addLayer(classified,
  {min: 0, max: 3, palette: ['gray', 'brown', 'blue', 'green']}, '2019');

// Cria um painel, com nome de "legend" e configura seu estilo
// ui.Panel(widgets, layout, style)
var legend = ui.Panel({style: {position: 'middle-right', padding: '8px 15px'}});

// === Função para gerar as cores e nomes da legenda ===

// Recebe a cor e o nome, volta a cor e o nome configurado
var makeRow = function(color, name) {
  var colorBox = ui.Label({
    style: {color: '#ffffff',
      backgroundColor: color,
      padding: '10px',
      margin: '0 0 4px 0',
    }
  });

  var description = ui.Label({
    value: name,
    style: {
      margin: '0px 0 4px 6px',
    }
  }); 
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')}
)};

// =====================================================

var title = ui.Label({
  value: 'Legend',
  style: {fontWeight: 'bold',
    fontSize: '16px',
    margin: '0px 0 4px 0px'}});

// Adicionar legenda após declarar a função e título no painel inicial
// add: adiciona widgets ao painel
legend.add(title);
legend.add(makeRow('gray','Built-up'))
legend.add(makeRow('brown','Bare Earth'))
legend.add(makeRow('blue','Water'))
legend.add(makeRow('green','Vegetation'))

Map.add(legend);

