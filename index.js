import { setUpNavigation, showText } from "./navigation.js";

let dataBaseline,
  data,
  viewBox,
  svg,
  xScale,
  yScale,
  dataToCoCompareTo,
  calculateColorScaleValue,
  anomalyAbsMax;
const selectedYear = 1887;

// wait until data is loaded
fetch("./data/dataBaseline.json")
  .then((response) => response.json())
  .then((json) => {
    dataBaseline = json;
    fetch("./data/new_data.json")
      .then((response) => response.json())
      .then((json) => {
        data = json;
        setUpVariables();
        setUpNavigation(manager, drawFunctions.length);
        manager.drawNextView();
        showText(manager);
      });
  });

// setup necessary to use library
const drawFunctions = [
  drawView0,
  drawView1,
  drawView2,
  drawView3,
  drawView4,
  drawView5,
  drawView6,
];
const onProgressUpdate = (progress, isReversed) => {
  d3.select("#progress-bar")
    .attr("x", viewBox.padding)
    .attr("y", viewBox.height - 3)
    .attr("height", 2)
    .attr(
      "width",
      progress * (viewBox.width - viewBox.padding - viewBox.paddingRight)
    )
    .attr("fill", "#80808070");
};

const manager = new aseq.TransitionsManager(
  drawFunctions,
  0.2,
  onProgressUpdate
);

// inital setup
function setUpVariables() {
  function round(number) {
    const roundTo = 10;
    return Math.round(number * roundTo) / roundTo;
  }
  anomalyAbsMax = round(d3.max(data, (d) => Math.abs(d.anomaly)));
  calculateColorScaleValue = (anomaly) => {
    const redScale = d3
      .scaleLinear()
      .domain([0, anomalyAbsMax])
      .range([0.5, 0]);

    const blueScale = d3
      .scaleLinear()
      .domain([-anomalyAbsMax, 0])
      .range([1, 0.5]);

    if (anomaly > 0) return redScale(anomaly);
    else return blueScale(anomaly);
  };

  dataToCoCompareTo = data.filter((e) => e.year === selectedYear);

  viewBox = {
    width: 550,
    height: 550,
    padding: 30,
    paddingBottom: 50,
    paddingRight: 70,
  };
  svg = d3
    .select("#visualization")
    .append("svg")
    .attr("viewBox", [0, 0, viewBox.width, viewBox.height]);

  const mean = d3.mean(dataBaseline, (d) => d.temp);
  let temps = dataToCoCompareTo.map(
    (obj) => obj.anomaly + dataBaseline[obj.month - 1].temp
  );
  const tempExtrema = { max: d3.max(temps), min: d3.min(temps) };

  const yScaleMax = (yScale = d3
    .scaleLinear()
    .range([viewBox.height - viewBox.paddingBottom, 200]) // add half stroke width
    .domain([
      10,
      d3.max([
        mean + d3.max(dataToCoCompareTo, (d) => d.anomaly),
        tempExtrema.max,
        d3.max(dataBaseline, (d) => d.temp),
      ]),
    ]));

  xScale = d3
    .scaleBand()
    .range([viewBox.padding, viewBox.width - viewBox.paddingRight])
    .domain(dataBaseline.map((d) => d.month));
}

// DRAW FUNCTIONS

function drawView0() {
  // create progress bar
  svg
    .append("rect")
    .attr("id", "progress-bar")
    .attr("height", 20)
    .attr("width", viewBox.width);

  // draw x-axis
  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0,${viewBox.height - viewBox.paddingBottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickFormat(
          (d, i) =>
            [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Okt",
              "Nov",
              "Dez",
            ][i]
        )
    );

  // draw y-axis
  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${viewBox.padding},0)`)
    .call(d3.axisLeft(yScale))
    .append("text")
    .text("°C")
    .attr("font-size", "1.2em")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("y", 200 - 10);

  // draw step chart line
  const path = d3.path();
  dataBaseline.map((object, i) => {
    if (i === 0) {
      path.moveTo(xScale(object.month), yScale(object.temp));
    } else {
      path.lineTo(xScale(object.month), yScale(object.temp));
    }
    path.lineTo(xScale(object.month) + xScale.bandwidth(), yScale(object.temp));
  });

  const renderedPath = svg
    .append("path")
    .attr("id", "baseline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2);

  animatePath(renderedPath);
}

function drawView1() {
  // draw line for selected yeaer
  const path = d3.path();
  dataToCoCompareTo.map((d, i) => {
    if (i === 0) {
      path.moveTo(xScale(d.month), yScale(dataBaseline[i].temp + d.anomaly));
    } else {
      path.lineTo(xScale(d.month), yScale(dataBaseline[i].temp + d.anomaly));
    }
    path.lineTo(
      xScale(d.month) + xScale.bandwidth(),
      yScale(dataBaseline[i].temp + d.anomaly)
    );
  });
  const renderedPath = svg
    .append("path")
    .attr("id", "redPath")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  animatePath(renderedPath);

  // create background year label
  svg
    .append("text")
    .attr("id", "background-year-label")
    .text(selectedYear)
    .attr("text-anchor", "middle")
    .attr("y", 150)
    .attr("font-size", 30)
    .attr("opacity", 0)
    .attr(
      "x",
      (viewBox.width - viewBox.paddingRight - viewBox.padding) / 2 +
        viewBox.padding
    )
    .gsapTo(
      manager,
      { attr: { opacity: 0.07 } },
      { autoHideOnReverseComplete: true }
    );
}

function drawView2() {
  // fill out anomaly
  svg
    .append("g")
    .attr("id", "filling-rects")
    .selectAll("rect")
    .data(dataToCoCompareTo)
    .enter()
    .append("rect")
    .attr("fill", "#ff000030")
    .attr("width", xScale.bandwidth())
    .attr("height", (d, i) => Math.abs(yScale(d.anomaly) - yScale(0)))
    .attr("x", (d) => xScale(d.month))
    .attr("y", (d, i) => {
      const temp = dataBaseline[i].temp + d.anomaly;
      if (dataBaseline[i].temp > temp) {
        return yScale(dataBaseline[i].temp);
      } else {
        return yScale(temp);
      }
    })
    .attr("opacity", 0)
    .gsapTo(manager, { attr: { opacity: 1 } });

  // bring lines to the front
  svg.select("#baseline").raise();
  svg.select("#redPath").raise();
}

function drawView3() {
  const blueMeanPath = d3.path();
  const mean = d3.mean(dataBaseline, (d) => d.temp);

  // create new blue path to transition to
  dataBaseline.map((object, i) => {
    if (i === 0) {
      blueMeanPath.moveTo(xScale(object.month), yScale(mean));
    } else {
      blueMeanPath.lineTo(xScale(object.month), yScale(mean));
    }
    blueMeanPath.lineTo(
      xScale(object.month) + xScale.bandwidth(),
      yScale(mean)
    );
  });

  // transition
  svg
    .select("#baseline")
    .gsapTo(manager, { attr: { d: blueMeanPath }, strokeWidth: 1.3 });

  // create new red path to transition to
  const newRedPath = d3.path();
  dataBaseline.map((object, i) => {
    if (i === 0) {
      newRedPath.moveTo(
        xScale(object.month),
        yScale(mean + dataToCoCompareTo[i].anomaly)
      );
    } else {
      newRedPath.lineTo(
        xScale(object.month),
        yScale(mean + dataToCoCompareTo[i].anomaly)
      );
    }
    newRedPath.lineTo(
      xScale(object.month) + xScale.bandwidth(),
      yScale(mean + dataToCoCompareTo[i].anomaly)
    );
  });

  // transition red path
  svg
    .select("#redPath")
    .gsapTo(
      manager,
      { attr: { d: newRedPath }, opacity: 0 },
      { autoHideOnComplete: true }
    );

  // transition filling rects
  svg
    .selectAll("#filling-rects rect")
    .gsapTo(manager, (d, i) => {
      const temp = dataBaseline[i].temp + d.anomaly;
      if (dataBaseline[i].temp > temp) {
        return { attr: { y: yScale(mean) } };
      } else {
        return { attr: { y: yScale(mean + d.anomaly) } };
      }
    })
    .gsapTo(manager, { attr: { fill: "#ff000050", stroke: "#ff0000" } });

  // transition y-axis
  svg
    .select("#y-axis")
    .gsapTo(manager, { opacity: 0 }, { autoHideOnComplete: true });

  // create anomaly scale
  const yScaleAnomaly = d3
    .scaleLinear()
    .range([yScale(mean - anomalyAbsMax), yScale(mean + anomalyAbsMax)])
    .domain([-anomalyAbsMax, anomalyAbsMax]);

  // create anomaly axis
  const anomalyAxis = svg
    .append("g")
    .attr("id", "anomaly-axis")
    .attr("transform", `translate(${viewBox.padding},0)`)
    .attr("opacity", 0);

  anomalyAxis
    .call(
      d3
        .axisLeft(yScaleAnomaly)
        .tickValues([-anomalyAbsMax, -0.5, 0, 0.5, anomalyAbsMax])
    )
    .append("text")
    .text("°C")
    .attr("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("y", yScale(mean + anomalyAbsMax) - 10);

  anomalyAxis.gsapTo(
    manager,
    { opacity: 1 },
    { autoHideOnReverseComplete: true }
  );

  // translate x-axis upwards
  svg
    .select("#x-axis")
    .lower()
    .gsapTo(manager, {
      attr: {
        transform: `translate(0,${yScale(mean - anomalyAbsMax)})`,
      },
    });
}

function drawView4() {
  function createColorLegend() {
    const legendColorStops = 100;
    svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "color-scale-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%")
      .selectAll("stop")
      .data(new Array(legendColorStops))
      .enter()
      .append("stop")
      .attr("offset", function (d, i) {
        return ((i * 1) / (legendColorStops - 1)) * 100 + "%";
      })
      .attr("stop-color", function (d, i) {
        return d3.interpolateSpectral((i * 1) / (legendColorStops - 1));
      });

    const mean = d3.mean(dataBaseline, (d) => d.temp);
    const strokeWidth = 0.5;

    const colorLegend = svg
      .append("g")
      .attr("id", "color-legend")
      .attr(
        "transform",
        `translate(${viewBox.width - viewBox.paddingRight + 20},0)`
      )
      .attr("opacity", 0);

    const height = -(
      yScale(mean + anomalyAbsMax) - yScale(mean - anomalyAbsMax)
    );

    // create unit label
    colorLegend
      .append("text")
      .text("°C")
      .attr("font-size", "11px")
      .attr("font-family", "sans-serif")
      .attr("fill", "black")
      .attr("transform", `translate(0,${yScale(mean + anomalyAbsMax) - 10})`);

    // create color bar
    colorLegend
      .append("rect")
      .attr("stroke", "black")
      .attr("stroke-width", strokeWidth)
      .attr("height", height)
      .attr("transform", `translate(2,${yScale(mean + anomalyAbsMax)})`)
      .attr("width", 10)
      .style("fill", "url(#color-scale-gradient)");

    // create ticks and labels
    const axis = colorLegend.append("g").call(
      d3
        .axisRight(
          d3
            .scaleLinear()
            .range([height - strokeWidth, 0 - strokeWidth])
            .domain([-anomalyAbsMax, anomalyAbsMax])
        )
        .tickValues([-anomalyAbsMax, -0.5, 0, 0.5, anomalyAbsMax])
    );

    axis.select(".domain").remove();
    axis
      .attr("transform", `translate(12,${yScale(mean + anomalyAbsMax)})`)
      .selectAll(".tick line")
      .attr("x1", -4)
      .attr("x2", 0)
      .attr("stroke-width", strokeWidth);

    return colorLegend;
  }

  const colorLegend = createColorLegend();
  colorLegend.gsapTo(
    manager,
    { attr: { opacity: 1 } },
    { autoHideOnReverseComplete: true }
  );

  // fill rects according to color scale
  svg.selectAll("#filling-rects rect").gsapTo(manager, (d, i) => {
    return {
      attr: {
        fill: d3.interpolateSpectral(calculateColorScaleValue(d.anomaly)),
      },
    };
  });
}

function drawView5() {
  // transition filling rects to all have the same height
  svg.selectAll("#filling-rects rect").gsapTo(manager, {
    attr: {
      y: yScale(d3.mean(dataBaseline, (d, i) => dataBaseline[i].temp)) - 10,
      height: 20,
      stroke: "#00000000",
    },
  });

  // add year label
  svg
    .select("#filling-rects")
    .append("text")
    .attr("text-anchor", "middle")
    .text(selectedYear)
    .attr("font-size", "0.7em")
    .style("opacity", 0)
    .attr("x", 14)
    .attr(
      "y",
      (d) => yScale(d3.mean(dataBaseline, (d, i) => dataBaseline[i].temp)) + 3.5
    )
    .gsapTo(manager, { opacity: 1 }, { autoHideOnReverseComplete: true });

  // translate x-axis
  svg.select("#x-axis").gsapTo(manager, {
    attr: {
      transform: `translate(0,${
        yScale(d3.mean(dataBaseline, (d) => d.temp)) + 10
      })`,
    },
  });

  // remove anomaly axis and baseline
  svg
    .selectAll("#baseline, #anomaly-axis")
    .gsapTo(manager, { opacity: 0 }, { autoHideOnComplete: true });

  svg
    .select("#background-year-label")
    .gsapTo(manager, { attr: { opacity: 0 } }, { autoHideOnComplete: true });
}

function drawView6() {
  const yScale = d3
    .scaleBand()
    .range([30, viewBox.height - viewBox.paddingBottom])
    .domain(data.map((d) => d.year));

  // one group for each year
  // from: https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
  const groupBy = (items, key) =>
    items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [...(result[item[key]] || []), item],
      }),
      {}
    );

  const groupedByYearMap = groupBy(data, "year");

  const yearGroups = svg
    .append("g")
    .attr("id", "heatmap")
    .selectAll(".year-group")
    .data(Object.keys(groupedByYearMap))
    .enter()
    .append("g")
    .attr("class", "year-group")
    .attr("opacity", 0);

  yearGroups
    .append("text")
    .text((d) => d)
    .attr("font-size", "0.7em")
    .attr("x", 14)
    .attr("y", (d) => yScale(parseInt(d)) + 4)
    .attr("text-anchor", "middle")
    .attr("opacity", (d, i) =>
      i === 0 || i === Object.keys(groupedByYearMap).length - 1 ? 0.35 : 0
    );

  yearGroups.on("click", function () {
    d3.select(this).raise();
    d3.select(this)
      .selectAll("rect")
      .attr("height", 20)
      .attr("y", (d) => yScale(d.year) - 10);
  });
  yearGroups
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "black");

      d3.select(this).select("text").attr("opacity", 1);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).attr("stroke", null);
      d3.select(this)
        .selectAll("rect")
        .attr("height", yScale.bandwidth())
        .attr("y", (d) => yScale(d.year));

      const i = Object.keys(groupedByYearMap).indexOf(d);
      d3.select(this)
        .select("text")
        .attr(
          "opacity",
          i === 0 || i === Object.keys(groupedByYearMap).length - 1 ? 0.35 : 0
        );
    });

  yearGroups
    .selectAll("rect")
    .data((d) => groupedByYearMap[d])
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.month))
    .attr("y", (d) => yScale(d.year))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) =>
      d.year === selectedYear
        ? "#808080"
        : d3.interpolateSpectral(calculateColorScaleValue(d.anomaly))
    );

  const timeline = gsap.timeline();

  // move current line of blocks to the top
  timeline.add(
    gsap.to("#filling-rects rect", {
      attr: { height: 10, y: 0 },
    })
  );

  // transition text
  timeline.add(gsap.to("#filling-rects text", { attr: { y: 8 } }), "<");

  // move x-axis to the bottom
  timeline.add(
    gsap.to("#x-axis", {
      duration: 0.5,
      attr: {
        transform: `translate(0,${viewBox.height - viewBox.paddingBottom})`,
      },
    }),
    "<"
  );

  // build chart
  timeline.add(
    gsap.to("#heatmap .year-group", {
      attr: { opacity: 1 },
      stagger: 0.004,
      onStart: () => svg.select("#heatmap").style("display", "block"),
      onReverseComplete: () => svg.select("#heatmap").style("display", "none"),
    })
  );

  const missingLine = yearGroups
    .filter((d) => d == selectedYear)
    .selectAll("rect");

  // transition block line to missing space
  timeline.add(
    aseq.createTransition(
      "#filling-rects rect",
      {
        onComplete: () => {
          missingLine.attr("fill", (d) =>
            d3.interpolateSpectral(calculateColorScaleValue(d.anomaly))
          );
        },
        onStart: () => {
          // move to front
          svg.select("#filling-rects").raise();
        },
        onReverseComplete: () => {
          svg.select("#filling-rects").lower();
        },
        attr: { y: yScale(selectedYear), height: yScale.bandwidth() },
      },
      {
        autoHideOnComplete: true,
        onReverseStart: () => missingLine.attr("fill", "#808080"),
      }
    )
  );
  // transition text
  timeline.add(
    aseq.createTransition(
      "#filling-rects text",
      {
        attr: { y: yScale(selectedYear) + 4 },
        onComplete: () => {
          gsap.to("#filling-rects text", {
            opacity: 0.35,
            duration: 2,
          });
        },
      },
      {
        onReverseStart: () => {
          svg.select("#filling-rects text").style("opacity", 1);
        },
      }
    ),
    "<"
  );

  manager.push(timeline);
}

function animatePath(renderedPath) {
  const length = renderedPath.node().getTotalLength();
  renderedPath
    .attr("stroke-dasharray", length + " " + length)
    .style("stroke-dashoffset", length)
    .gsapTo(manager, { strokeDashoffset: 0, duration: 3, ease: "none" });
}
