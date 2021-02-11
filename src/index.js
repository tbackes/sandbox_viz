const d3 = require('d3');
const plotly = require('../node_modules/plotly.js');
const dscc = require('@google/dscc');
const local = require('./localMessage.js');

// change this to 'true' for local development
// change this to 'false' before deploying
export const LOCAL = false;

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
  var hex_strip = hex_color.replace(new RegExp("^#"),"");
  hex_strip = (hex_strip.length==3)? hex_strip+hex_strip : hex_strip;
  var rgba = 'rgba(' 
    + parseInt(hex_strip.substring(0,2), 16) + ',' 
    + parseInt(hex_strip.substring(2,4), 16) + ',' 
    + parseInt(hex_strip.substring(4,6), 16) + ','
    + opacity + ')';
  return rgba
}

const isNull = (x) => {
  return x == null || x == "null" || x == "";
}

const isNumeric = (x) => {
  return !isNull(x) && !isNaN(x);
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
  myDiv.setAttribute("height", `${dscc.getHeight()}px`);
  myDiv.setAttribute("width", `${dscc.getWidth()}px`);

  document.body.appendChild(myDiv);

  // write your visualization code here
  // console.log("I'm the callback and I was passed this data: " + JSON.stringify(message.style, null, '  '));
  // console.log('color: ' + message.style['metricColor1'].value['color'] + '; ' + hex_to_rgba_str(message.style['metricColor1'].value['color'], 1))
  // console.log('metricLineWeight: ' + message.style['metricLineWeight1'])

  // // console.log('DEFAULT')
  // // console.log(message.tables.DEFAULT)

  // console.log('Dimension')
  // console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  // console.log('Metric')
  // console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  // console.log('Lower')
  // console.log(message.tables.DEFAULT.map(d => d.metric_lower[0]))
  // console.log('Upper')
  // console.log(message.tables.DEFAULT.map(d => d.metric_upper[0]))

  console.log('# Series: ' + message.tables.DEFAULT[0].metric.length)
  console.log('Metric name: ' + message.fields.metric_upper[0].name)


  //gather plot-level style parameters
  var yAxisMin = styleVal(message, 'yMin');
  var yAxisMax = styleVal(message, 'yMax');
  var yLabel = styleVal(message, 'yLabel');
  var metricFmt = styleVal(message, 'metricFormatString');
  var ciFmt = styleVal(message, 'ciFormatString');

  // console.log('yMin: ' + !isNull(yAxisMin) + '; ' + !isNaN(yAxisMin) + '; ' + isNumeric(yAxisMin))

  // loop through metrics and add traces
  var num_ci_metrics = 
    Math.min(
      message.tables.DEFAULT[0].metric_lower.length, 
      message.tables.DEFAULT[0].metric_upper.length);
  console.log('num_ci_metrics: ' + num_ci_metrics)
  var data = []
  var i;
  for (i=0; i<message.tables.DEFAULT[0].metric.length; i++){
    console.log('i: '+i)

    console.log('Fill Opacity: ' + JSON.stringify(message.style['metricFillOpacity'+(i+1)], null, '  '));
    // Gather all style parameters
    // series properties
    var metricLineWeight =  styleVal(message, 'metricLineWeight'+(i+1));
    var metricLineColor =  styleVal(message, 'metricColor'+(i+1));
    var metricFillColor =  hex_to_rgba_str(
      styleVal(message, 'metricFillColor'+(i+1)),
      styleVal(message, 'metricFillOpacity'+(i+1)));
    var metricShowPoints =  styleVal(message, 'metricShowPoints'+(i+1));
    var metricShowCI =  styleVal(message, 'metricShowCI'+(i+1));
    // console.log((i+1) + " metricLineWeight: " + JSON.stringify(message.style['metricLineWeight'+(i+1)], null, '  '));
    // console.log(metricLineWeight);

    // trace for metric trend line
    var trace_metric = {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric[i]),
      customdata: message.tables.DEFAULT.map(d => [d.metric_lower[i], d.metric_upper[i]]),
      line: {
        color: metricLineColor,
        width: metricLineWeight
      }, 
      mode: (metricShowPoints)? 'lines+markers' : 'lines', 
      name: message.fields.metric[i].name, 
      type: "lines",
      legendgroup: 'metric'+i, 
      //hovertemplate: '<b>Estimate: %{y:,.0f}</b>; <i>95% CI:   %{customdata[0]:,.0f} - %{customdata[1]:,.0f}</i>',
      hovertemplate: '<b>%{y:'+metricFmt+'}</b><i> (%{customdata[0]:' + ciFmt + '} - %{customdata[1]:' + ciFmt + '})</i>'
    };

    data.push(trace_metric);

    // Only add CI trend-lines if they are present in the data
    if (i < num_ci_metrics) {
      // trace for lower bound of CI
      var trace_lower = {
        x: message.tables.DEFAULT.map(d => d.dimension[0]),
        y: message.tables.DEFAULT.map(d => d.metric_lower[i]),
        line: {width: 1}, 
        marker: {color: metricFillColor}, 
        mode: "lines", 
        name: message.fields.metric_lower[i].name, 
        type: "scatter",
        legendgroup: 'ci'+i,
        hoverinfo: 'skip', 
        visible: (metricShowCI)? true : 'legendonly',
        showlegend: false
      };

      // trace for upper bound of CI
      var trace_upper = {
        x: message.tables.DEFAULT.map(d => d.dimension[0]),
        y: message.tables.DEFAULT.map(d => d.metric_upper[i]),
        line: {width: 1}, 
        fill: "tonexty", 
        fillcolor: metricFillColor, 
        marker: {color: metricFillColor}, 
        line: {color: metricFillColor}, 
        mode: "lines", 
        name: message.fields.metric_upper[i].name, 
        type: "scatter",
        legendgroup: 'ci'+i,
        hoverinfo: 'skip', 
        visible: (metricShowCI)? true : 'legendonly',
        showlegend: true
      };

      data.push(trace_lower, trace_upper);
    }
  }

  var yAxisRange = {};
  if (!isNumeric(yAxisMin) && !isNumeric(yAxisMax)){
    yAxisRange = {};
  }
  else if (!isNumeric(yAxisMin)){
    var minValue = Math.min.apply(Math, message.tables.DEFAULT.map(function(d) {return Math.min(...d.metric_lower)}));
    yAxisRange = {range: [Math.floor(0.9*minValue), yAxisMax]};
  }
  else if (!isNumeric(yAxisMax)){
    var maxValue = Math.max.apply(Math, message.tables.DEFAULT.map(function(d) {return Math.max(...d.metric_upper)}));
    yAxisRange = {range: [yAxisMin, Math.ceil(1.1*maxValue)]};
  }
  else {
    yAxisRange = {range: [yAxisMin, yAxisMax]};
  }
  console.log('yAxisRange: '+JSON.stringify(yAxisRange, null, '  '));

  var yAxisTitle = {};
  if (yLabel==null) {
    yAxisTitle = {title: {}}
  }
  else {
    yAxisTitle = {title: {text: yLabel}}
  }

  var layout = {
    height: height,
    showlegend: true,
    yaxis: Object.assign({}, yAxisRange, yAxisTitle),
    // legend: {
    //   orientation: 'h',
    //   yanchor: "bottom",
    //   y: 1.02,
    //   xanchor: "right",
    //   x: 1
    // }
  };

  plotly.newPlot(myDiv, data, layout);
};

// renders locally
if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}