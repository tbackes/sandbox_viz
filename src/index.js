const d3 = require('d3');
const plotly = require('../node_modules/plotly.js');
const dscc = require('@google/dscc');
const local = require('./localMessage.js');

// change this to 'true' for local development
// change this to 'false' before deploying
export const LOCAL = false;

// parse the style value
const styleVal = (message, styleId) => {
  // console.log(styleId)
  // console.log(message.style[styleId])
  // console.log(typeof message.style[styleId].defaultValue)
  if (!!message.style[styleId].defaultValue && typeof message.style[styleId].defaultValue === "object") {
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

const toDate = (dateString) => {
  let year = dateString.substring(0,4)
  let month = dateString.substring(4,6)-1
  let day = dateString.substring(6,8)
  let hour = dateString.substring(8,10)
  let min = dateString.substring(10,12)
  let sec = dateString.substring(12,14)

  return new Date(year, month, day, hour, min, sec)
}

Date.prototype.addDays = function(days) {
    return new Date(this.valueOf()+(24*60*60*days))
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

  console.log('# Series: ' + message.tables.DEFAULT[0].metric.length)
  console.log('Metric name: ' + message.fields.metric_upper[0].name)
  //gather plot-level style parameters
  var xAxisDate = styleVal(message, 'xAxisDate');
  var yAxisMin = styleVal(message, 'yMin');
  var yAxisMax = styleVal(message, 'yMax');
  var yLabel = styleVal(message, 'yLabel');
  var metricFmt = styleVal(message, 'metricFormatString');
  var ciFmt = styleVal(message, 'ciFormatString');

  // loop through metrics and add traces
  var num_ci_metrics = 
    Math.min(
      message.tables.DEFAULT[0].metric_lower.length, 
      message.tables.DEFAULT[0].metric_upper.length);
  console.log('num_ci_metrics: ' + num_ci_metrics);
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

    // Design hovertemplate
    var customdata = message.tables.DEFAULT.map(d => [d.metric_lower[i], d.metric_upper[i]]); 
    // var hovertemplate = `<b>%{ ${metric}:${metricFmt} }</b><i> (%{ ${ciLower}:${ciFmt} } - %{ ${ciUpper}:${ciFmt} })</i>`;
    var hovertemplate = `<b>%{y:${metricFmt}}</b><i> (%{customdata[0]:${ciFmt}} - %{customdata[1]:${ciFmt}})</i>`;

    // Don't include CI in hovertemplate if no data was specified
    if (i >= num_ci_metrics){
      hovertemplate = `<b>%{y:${metricFmt}</b>`;
      customdata = message.tables.DEFAULT.map(d => [null, null])
    }

    var xData = xAxisDate
      ? message.tables.DEFAULT.map(d => toDate(d.dimension[0])) 
      : message.tables.DEFAULT.map(d => d.dimension[0])

    // trace for metric trend line
    var trace_metric = {
      x: xData,
      y: message.tables.DEFAULT.map(d => d.metric[i]),
      customdata,
      line: {
        color: metricLineColor,
        width: metricLineWeight
      }, 
      mode: (metricShowPoints)? 'lines+markers' : 'lines', 
      name: message.fields.metric[i].name, 
      type: "lines",
      legendgroup: 'metric'+i, 
      hovertemplate
    };

    data.push(trace_metric);

    // Only add CI trend-lines if they are present in the data
    if (i < num_ci_metrics) {
      // trace for lower bound of CI
      var trace_lower = {
        x: xData,
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
        x: xData,
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

  // format fo x axis
  var xAxisMin = Math.min.apply(Math, message.tables.DEFAULT.map(function(d) {return Math.min(...d.dimension)}))
  var xAxisMax = Math.max.apply(Math, message.tables.DEFAULT.map(function(d) {return Math.max(...d.dimension)}))
  var xAxisRange = {};
  console.log([xAxisMin, xAxisMax])
  if (xAxisDate) {
    xAxisRange = {range: [toDate(xAxisMin.toString()), toDate(xAxisMax.toString())]};
  }
  console.log([xAxisMin, xAxisMax])

  // format for y axis
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
    //xaxis: Object.assign({}, xAxisRange),
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