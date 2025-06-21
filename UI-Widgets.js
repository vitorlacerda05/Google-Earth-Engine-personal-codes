// ============== ESTUDO DE UI, WIDGETS ==================

// ---- BOTÃO ----

//Callback é a função que ocorre quando acontece o evento (click, neste caso)
var callback_button = function() {
  print('Oi')
}

var button = ui.Button('Clique em mim', callback_button)

// Ao inves de fazer a função, posso usar .onClick
/* button.onClick(function(){
  print('Oi')
}) */

print (button)

var button2 = ui.Button({
  label: 'Pegar centro do mapa', 
  onClick: function(){
    print(Map.getCenter())
  }
})

print (button2)

// ---- LABEL ----

var label = ui.Label('Texto Label: \n new line 1 \n new line 2', {whiteSpace: 'pre'})
print(label)

// Label estilisado

var redLabel = ui.Label('Big, Red Label');

redLabel.style().set('color', 'red');
redLabel.style().set('fontWeight', 'bold');
redLabel.style().set({
  fontSize: '32px',
  padding: '10px'
});

print(redLabel);

// ---- CHECK BOX ----

// Quando o estado da caixa de seleção muda, os retornos de chamada registrados no widget 
// recebem um valor booleano indicando se a caixa de seleção está marcada

var checkbox = ui.Checkbox('Mostrar mapa', true)

// Criar a função para mostrar/não mostrar algo
checkbox.onChange(function(checked){
  Map.layers().get(0).setShown(checked)
})

Map.addLayer(ee.Image('CGIAR/SRTM90_V4'));
print(checkbox);

// ---- SLIDER ----

// Criar slider do checkbox

var slider = ui.Slider(/*min, max, value, step, onChange, direction, disabled, style*/);

slider.setValue(0.9);  // Set a default value.
slider.onChange(function(value) {
  Map.layers().get(0).setOpacity(value); //get(1) pra pegar a outra lista
});                                     //layers() retorna lista das layers

print(slider, 'Opacidade checkbox')

// ---- DATE SLIDER ----

// Use um DateSlider para criar composições anuais desta coleção.
var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1');
// Pegar o início da coleção
var start = ee.Image(collection.first()).date().get('year').format();
// Pegar o agora da coleção
var now = Date.now();
// Converter para Server Side
var end = ee.Date(now).format();

// Execute esta função em uma alteração do dateSlider.
var showMosaic = function(range) {
  var mosaic = ee.Algorithms.Landsat.simpleComposite({
    collection: collection.filterDate(range.start(), range.end())
  });
  // Calcule de forma assíncrona o nome do composto. Exiba-o.
  range.start().get('year').evaluate(function(name) {
    var visParams = {bands: ['B4', 'B3', 'B2'], max: 100};
    var layer = ui.Map.Layer(mosaic, visParams, name + ' composite');
    Map.layers().set(0, layer);
  });
};

// Calcule de forma assíncrona o intervalo de datas e mostre o controle deslizante.
var dateRange = ee.DateRange(start, end).evaluate(function(range) {
  var dateSlider = ui.DateSlider({
    start: range['dates'][0],
    end: range['dates'][1],
    value: null,
    period: 365,
    onChange: showMosaic
  });
  Map.add(dateSlider.setValue(now));
});

// ---- SELECT ----

var places = {
  MTV: [-122.0849, 37.3887],
  PEK: [116.4056, 39.9097],
  ZRH: [8.536, 47.376]
};

//ui.Select(items, placeholder, value, onChange, disabled, style)
var select = ui.Select({
  items: Object.keys(places),
  onChange: function(key) {
    Map.setCenter(places[key][0], places[key][1]);
  }
});

// Set a place holder.
select.setPlaceholder('Choose a location...');

print(select);


