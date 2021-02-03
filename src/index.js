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

const drawViz = message => {
  // const margin = { left: 20, right: 20, top: 20, bottom: 20 };
  // const height = dscc.getHeight() - 10;
  // const width = dscc.getWidth();

  // const chartHeight = height - margin.top - margin.bottom;
  // const chartWidth = width - margin.left - margin.right;

  // // remove existing svg
  // d3.select("body")
  //   .selectAll("svg")
  //   .remove();

  // // make a canvas
  // const svg = d3
  //   .select("body")
  //   .append("svg")
  //   .attr("width", width)
  //   .attr("height", height);

  // // make an svg for the bar chart
  // const chartSvg = svg
  //   .append("svg")
  //   .attr("x", margin.left)
  //   .attr("y", margin.top)
  //   .attr("width", chartWidth)
  //   .attr("height", chartHeight);

  // // xScale to distribute bars
  // const xScale = d3
  //   .scaleBand()
  //   .domain(message.tables.DEFAULT.map(d => d.dimension[0]))
  //   .range([0, chartWidth])
  //   .paddingInner(0.3);

  // // yScale to size bars
  // const yScale = d3
  //   .scaleLinear()
  //   .domain([0, d3.max(message.tables.DEFAULT.map(d => d.metric[0]))])
  //   .range([0, chartHeight]);

  // // get the user-selected bar color
  // let barColor = styleVal(message, "barColor");

  // // add bars
  // const bars = chartSvg
  //   .append("g")
  //   .attr("class", "bars")
  //   .selectAll("rect.bars")
  //   .data(message.tables.DEFAULT)
  //   .enter()
  //   .append("rect")
  //   .attr("x", d => xScale(d.dimension[0]))
  //   .attr("y", d => chartHeight - yScale(d.metric[0]))
  //   .attr("width", xScale.bandwidth())
  //   .attr("height", d => yScale(d.metric[0]))
  //   .attr("fill", barColor);

  // // add text
  // const text = svg
  //   .append("g")
  //   .selectAll("text")
  //   .data(message.tables.DEFAULT)
  //   .enter()
  //   .append("text")
  //   .attr(
  //     "x",
  //     d => xScale(d.dimension[0]) + xScale.bandwidth() / 2 + margin.left
  //   )
  //   .attr("y", height - margin.bottom / 4)
  //   .attr("text-anchor", "middle")
  //   .attr("fill", barColor)
  //   .text(d => d.dimension[0]);

  // // set margins + canvas size
  // const margin = { top: 10, bottom: 50, right: 10, left: 10 };
  // const height = dscc.getHeight() - margin.top - margin.bottom;
  // const width = dscc.getWidth() - margin.left - margin.right;

  // // remove the svg if it already exists
  // if (document.querySelector("svg")) {
  //   let oldSvg = document.querySelector("svg");
  //   oldSvg.parentNode.removeChild(oldSvg);
  // }

  // set margins + canvas size
  const margin = { top: 10, bottom: 50, right: 10, left: 10 };
  const height = dscc.getHeight() - margin.top - margin.bottom;
  const width = dscc.getWidth() - margin.left - margin.right;

  console.log('Height: ' + height)
  console.log('Margin Top: ' + margin.top)
  console.log('Margin Bottom: ' + margin.bottom)
  console.log('GetHeight(): ' + dscc.getHeight())

  // remove the div if it already exists
  if (document.querySelector("div")) {
    let oldDiv = document.querySelector("div");
    oldDiv.parentNode.removeChild(oldDiv);
  }

  const myDiv = document.createElement('div');
  myDiv.setAttribute("height", `${height}px`);
  myDiv.setAttribute("width", `${width}px`);

  document.body.appendChild(myDiv);

  // write your visualization code here
  console.log("I'm the callback and I was passed this data: " + JSON.stringify(message.tables.DEFAULT, null, '  '));

  console.log('DEFAULT')
  console.log(message.tables.DEFAULT)

  console.log('Dimension')
  console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  console.log('Metric')
  console.log(message.tables.DEFAULT.map(d => d.metric[0]))
  console.log('Lower')
  console.log(message.tables.DEFAULT.map(d => d.metric_lower[0]))
  console.log('Upper')
  console.log(message.tables.DEFAULT.map(d => d.metric_upper[0]))



  // var data = [
  //   {
  //     x: message.tables.DEFAULT.map(d => d.dimension[0]),
  //     y: message.tables.DEFAULT.map(d => d.metric_lower[0]),
  //     type: 'bar'
  //   },
  //   {
  //     x: message.tables.DEFAULT.map(d => d.dimension[0]),
  //     y: message.tables.DEFAULT.map(d => d.metric[0]),
  //     type: 'bar'
  //   },
  //   {
  //     x: message.tables.DEFAULT.map(d => d.dimension[0]),
  //     y: message.tables.DEFAULT.map(d => d.metric_upper[0]),
  //     type: 'bar'
  //   }
  // ];

  var trace1 = {
    x: message.tables.DEFAULT.map(d => d.dimension[0]),
    y: message.tables.DEFAULT.map(d => d.metric_lower[0]),
    line: {width: 0}, 
    marker: {color: "444"}, 
    mode: "lines", 
    name: "95% CI", 
    type: "scatter",
    legendgroup: '95% CI',
    hoverinfo: 'skip', 
    visible: 'legendonly',
  };

  var trace2 = {
    x: message.tables.DEFAULT.map(d => d.dimension[0]),
    y: message.tables.DEFAULT.map(d => d.metric_upper[0]),
    line: {width: 0}, 
    fill: "tonexty", 
    fillcolor: "rgba(68, 68, 68, 0.3)", 
    line: {width: 0}, 
    marker: {color: "444"}, 
    mode: "lines", 
    name: "Upper Bound", 
    type: "scatter",
    legendgroup: '95% CI',
    hoverinfo: 'skip', 
    visible: 'legendonly',
    showlegend: false
  };

  var trace3 = {
    x: message.tables.DEFAULT.map(d => d.dimension[0]),
    y: message.tables.DEFAULT.map(d => d.metric[0]),
    customdata: message.tables.DEFAULT.map(d => [d.metric_lower[0], d.metric_upper[0]]),
    line: {color: "rgb(31, 119, 180)"}, 
    mode: "lines", 
    name: "Measurement", 
    type: "lines",
    legendgroup: 'Estimate 1',
    //hovertemplate: '<b>Estimate: %{y:,.0f}</b>; <i>95% CI:   %{customdata[0]:,.0f} - %{customdata[1]:,.0f}</i>',
    hovertemplate: '<b>%{y:.3%}</b><i> (%{customdata[0]:.3%} - %{customdata[1]:.3%})</i>'
  };

  var data = [trace1, trace2, trace3]
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