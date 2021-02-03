const d3 = require('d3');
const plotly = require('../node_modules/plotly.js');
const dscc = require('@google/dscc');
const local = require('./localMessage.js');

// change this to 'true' for local development
// change this to 'false' before deploying
export const LOCAL = true;

// parse the style value
const styleVal = (message, styleId) => {
  if (typeof message.style[styleId].defaultValue === "object") {
    return message.style[styleId].value.color !== undefined
      ? message.style[styleId].value.color
      : message.style[styleId].defaultValue.color;
  }
  return message.style[styleId].value !== undefined
    ? message.style[styleId].value
    : message.style[styleId].defaultValue;
};

const hex_to_rgba_str = (hex_color, opacity) => {
  console.log('hex_color: ' + hex_color)
  var hex_strip = hex_color.replace(new RegExp("^#"),"")
  console.log('hex_strip: ' + hex_strip)
  console.log('hex_strip.length: ' + hex_strip.length)
  hex_strip = (hex_strip.length==3)? hex_strip+hex_strip : hex_strip;
  var rgba = 'rgba(' 
    + parseInt(hex_strip.substring(0,2), 16) + ',' 
    + parseInt(hex_strip.substring(2,4), 16) + ',' 
    + parseInt(hex_strip.substring(4,6), 16) + ','
    + opacity + ')';
  console.log('rgba: ' + rgba)
  return rgba
}

const drawViz = message => {

  // set margins + canvas size
  const margin = { top: 10, bottom: 50, right: 10, left: 10 };
  const height = dscc.getHeight() - margin.top - margin.bottom;
  const width = dscc.getWidth() - margin.left - margin.right;

  // remove the div if it already exists
  if (document.querySelector("div")) {
    let oldDiv = document.querySelector("div");
    oldDiv.parentNode.removeChild(oldDiv);
  }

  // create div for plotly plot
  const myDiv = document.createElement('div');
  myDiv.setAttribute("height", `${height}px`);
  myDiv.setAttribute("width", `${width}px`);

  document.body.appendChild(myDiv);

  // write your visualization code here
  console.log("I'm the callback and I was passed this data: " + JSON.stringify(message.style, null, '  '));
  console.log('color: ' + message.style['metricColor1'].value['color'] + '; ' + hex_to_rgba_str(message.style['metricColor1'].value['color'], 1))
  console.log('metricLineWeight: ' + message.style['metricLineWeight1'])

  // console.log('DEFAULT')
  // console.log(message.tables.DEFAULT)

  console.log('Dimension')
  console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  console.log('Metric')
  console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  console.log('Lower')
  console.log(message.tables.DEFAULT.map(d => d.metric_lower[0]))
  console.log('Upper')
  console.log(message.tables.DEFAULT.map(d => d.metric_upper[0]))

  console.log('# Series: ' + message.tables.DEFAULT[0].metric.length)
  console.log('Metric name: ' + message.fields.metric_upper[i])

  // loop through metrics and add traces
  var data = []
  var i;
  for (i=0; i<message.tables.DEFAULT[0].metric.length; i++){

    // Gather all style parameters
    var metricLineWeight =  message.style['metricLineWeight'+(i+1)].value
    ? message.style['metricLineWeight'+(i+1)].value
    : message.style['metricLineWeight'+(i+1)].defaultValue;

    var metricLineColor =  message.style['metricColor'+(i+1)].value
    ? message.style['metricColor'+(i+1)].value['color']
    : message.style['metricColor'+(i+1)].defaultValue['color'];

    var metricShowPoints =  message.style['metricShowPoints'+(i+1)].value
    ? message.style['metricShowPoints'+(i+1)].value
    : message.style['metricShowPoints'+(i+1)].defaultValue;

    // trace for lower bound of CI
    var trace_lower = {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric_lower[i]),
      line: {width: 0}, 
      marker: {color: hex_to_rgba_str(metricLineColor, 0.3)}, 
      mode: "lines", 
      name: message.fields.metric_lower[i].name, 
      type: "scatter",
      legendgroup: message.fields.metric_lower[i].name,
      hoverinfo: 'skip', 
      visible: 'legendonly',
    };

    // trace for upper bound of CI
    var trace_upper = {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric_upper[i]),
      line: {width: 0}, 
      fill: "tonexty", 
      fillcolor: hex_to_rgba_str(metricLineColor, 0.3), 
      line: {width: 0}, 
      marker: {color: hex_to_rgba_str(metricLineColor, 0.3)}, 
      mode: "lines", 
      name: message.fields.metric_upper[i].name, 
      type: "scatter",
      legendgroup: message.fields.metric_lower[i].name,
      hoverinfo: 'skip', 
      visible: 'legendonly',
      showlegend: false
    };

    // trace for metric trend line
    var trace_metric = {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric[i]),
      customdata: message.tables.DEFAULT.map(d => [d.metric_lower[i], d.metric_upper[i]]),
      line: {color: metricLineColor}, 
      mode: (metricShowPoints)? 'lines+markers' : 'lines', 
      name: message.fields.metric[i].name, 
      type: "lines",
      legendgroup: message.fields.metric[i].name, 
      //hovertemplate: '<b>Estimate: %{y:,.0f}</b>; <i>95% CI:   %{customdata[0]:,.0f} - %{customdata[1]:,.0f}</i>',
      hovertemplate: '<b>%{y:.3%}</b><i> (%{customdata[0]:.3%} - %{customdata[1]:.3%})</i>'
    };

    data.push(trace_lower, trace_upper, trace_metric)
  }

  var layout = {
    height: height,
    showlegend: true,
    yaxis: {rangemode: 'tozero'},
    legend: {
      orientation: 'h',
      yanchor: "bottom",
      y: 1.02,
      xanchor: "right",
      x: 1
    }
  };

  plotly.newPlot(myDiv, data, layout);
};

// renders locally
if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}