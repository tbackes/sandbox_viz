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



  var data = [
    {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric_lower[0]),
      type: 'bar'
    },
    {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric[0]),
      type: 'bar'
    },
    {
      x: message.tables.DEFAULT.map(d => d.dimension[0]),
      y: message.tables.DEFAULT.map(d => d.metric_upper[0]),
      type: 'bar'
    }
  ];

  plotly.newPlot(myDiv, data);
};

// renders locally
if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}