import { createTransition, TransitionsManager } from "./helper_functions.js";




let dataBaseline,
  data,
  viewBox,
  svg,
  xScale,
  yScale,
  dataToCoCompareTo,
  calculateColorScaleValue;
const selectedYear = 1878;

fetch("./data/dataBaseline.json")
  .then((response) => response.json())
  .then((json) => {
    dataBaseline = json;
    fetch("./data/data.json")
      .then((response) => response.json())
      .then((json) => {
        data = json;
        setUpVariables();
        setUpNavigation();
        m1.drawNextStep();
        showText();
      });
  });

// setup necessary to use library
const drawFunctions = [
  drawStep0,
  drawStep3,
  drawStep4,
  drawStep5,
  drawStep52,
  drawStep6,
  drawStep7,
];
const onProgressUpdate = (progress, isReversed) => {
  console.log(progress);

  d3.select("#un")
    .attr("width", progress * paddedViewBox.width)
    .attr("fill", isReversed ? "#123456" : "#ff0000");
};
const m1 = new TransitionsManager(drawFunctions, 0.2);

function showText(){
  d3.selectAll("#text-div .text").style("display", "none");
  d3.select("#text-" + m1.getStep()).style("display", "inline");
}

function setUpVariables() {
  calculateColorScaleValue = (anomaly) => {
    const redScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.anomaly)])
      .range([0.5, 0]);

    const blueScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.anomaly), 0])
      .range([1, 0.5]);

    if (anomaly > 0) return redScale(anomaly);
    else return blueScale(anomaly);
  };

  dataToCoCompareTo = data.filter((e) => e.year === selectedYear);

  viewBox = { width: 550, height: 550, padding: 30 };
  svg = d3
    .select("#visualization")
    .append("svg")
    .attr("viewBox", [0, 0, viewBox.width, viewBox.height]);

  const mean = d3.mean(dataBaseline, (d) => d.temp);
  let temps = dataToCoCompareTo.map(
    (obj) => obj.anomaly + dataBaseline[obj.month - 1].temp
  );
  const tempExtrema = { max: d3.max(temps), min: d3.min(temps) };

  yScale = d3
    .scaleLinear()
    .range([viewBox.height - viewBox.padding, 200]) // add half stroke width
    .domain([
      10,
      d3.max([
        mean + d3.max(dataToCoCompareTo, (d) => d.anomaly),
        tempExtrema.max,
        d3.max(dataBaseline, (d) => d.temp),
      ]),
    ]);

  xScale = d3
    .scaleBand()
    .range([viewBox.padding, viewBox.width])
    .domain(dataBaseline.map((d) => d.month));
}

function setUpNavigation() {
  d3.select("#step-0").style("background-color", "black");

  d3.selectAll(".step-button").on("click", function(){
    d3.selectAll(".step-button").style("background-color", "#ff0000");
    d3.select(this).style("background-color", "black");
  })
  const numberOfSteps = drawFunctions.length;

  //prev and next button
  d3.selectAll("#prev, #next").on("click", function () {
    const id = d3.select(this).attr("id");
    if (id === "next" && m1.getStep() < numberOfSteps - 1) {
      m1.drawNextStep();
      showText();
    } else if (id === "prev" && m1.getStep() > 0) {
      m1.drawPrevStep();
      showText();
    }
    d3.selectAll(".step-button").style("background-color", "rgb(174, 174, 174)");
    d3.select("#step-" + m1.getStep()).style("background-color", "black");
  });

  // step buttons
  for (let i = 0; i < numberOfSteps; i++) {
    d3.selectAll("#step-" + i).on("click", function () {
      d3.selectAll(".step-button").style("background-color", "rgb(174, 174, 174)");
      d3.select(this).style("background-color", "black");
      m1.drawStep(i);
      showText();
    });
  }

  //selector
  // d3.select("#selector").on("change", (event) => onSelect(event))
  // function onSelect(event) {
  //   m1.drawStep(event.target.value);
  // }
}

function animatePath(renderedPath) {
  const length = renderedPath.node().getTotalLength();
  renderedPath
    .attr("stroke-dasharray", length + " " + length)
    .style("stroke-dashoffset", length)
    .gsapTo(m1, { strokeDashoffset: 0, duration: 3, ease: "none" });
}

function drawStep0() {
  // draw x-axis
  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0,${viewBox.height - viewBox.padding})`)
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
    .call(d3.axisLeft(yScale));

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

function drawStep3() {
  // draw new step chart line
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
}

function drawStep4() {
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
    .gsapTo(m1, { attr: { opacity: 1 } });

  svg.select("#baseline").raise();

  svg.select("#redPath").raise();
}

function drawStep5() {
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
    .gsapTo(m1, { attr: { d: blueMeanPath }, strokeWidth: 1.3 });

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

  // transition
  svg
    .select("#redPath")
    .gsapTo(
      m1,
      { attr: { d: newRedPath }, opacity: 0 },
      { autoHideOnComplete: true }
    );

  // transition filling rects
  svg.selectAll("#filling-rects rect").gsapTo(m1, (d, i) => {
    const temp = dataBaseline[i].temp + d.anomaly;
    if (dataBaseline[i].temp > temp) {
      return { attr: { y: yScale(mean) } };
    } else {
      return { attr: { y: yScale(mean + d.anomaly) } };
    }
  });

  svg
    .selectAll("#filling-rects rect")
    .gsapTo(m1, { attr: { fill: "#ff000050", stroke: "#ff0000" } });

  // transition y-axis
  svg
    .select("#y-axis")
    .gsapTo(m1, { opacity: 0 }, { autoHideOnComplete: true });

  // create anomaly scale
  const yScaleAnomaly = d3
    .scaleLinear()
    .range([
      yScale(mean + d3.min(dataToCoCompareTo, (d) => d.anomaly)),
      yScale(mean + d3.max(dataToCoCompareTo, (d) => d.anomaly)),
    ])
    .domain([
      d3.min(dataToCoCompareTo, (d) => d.anomaly),
      d3.max(dataToCoCompareTo, (d) => d.anomaly),
    ]);

  // create anomaly axis
  svg
    .append("g")
    .attr("id", "anomaly-axis")
    .attr("transform", `translate(${viewBox.padding},0)`)
    .attr("opacity", 0)
    .call(d3.axisLeft(yScaleAnomaly).ticks(3))
    .gsapTo(m1, { opacity: 1 });

  // translate x-axis upwards
  svg
    .select("#x-axis")
    .lower()
    .gsapTo(m1, {
      attr: {
        transform: `translate(0,${yScale(
          mean + d3.min(dataToCoCompareTo, (d) => d.anomaly)
        )})`,
      },
    });
}

function drawStep52() {
  svg.selectAll("#filling-rects rect").gsapTo(m1, (d, i) => {
    return {
      attr: {
        fill: d3.interpolateRdBu(calculateColorScaleValue(d.anomaly)),
      },
    };
  });
}

function drawStep6() {
  // transition filling rects to all have the same height
  svg.selectAll("#filling-rects rect").gsapTo(m1, {
    attr: {
      y: yScale(d3.mean(dataBaseline, (d, i) => dataBaseline[i].temp)) - 10,
      height: 20,
      stroke: "#00000000",
    },
  });

  svg
    .select("#filling-rects")
    .append("text")
    .attr("text-anchor", "middle")
    .text(selectedYear)
    .attr("font-size", "0.7em")
    .attr("opacity", 0)
    .attr("x", 14)
    .attr(
      "y",
      (d) => yScale(d3.mean(dataBaseline, (d, i) => dataBaseline[i].temp)) + 3.5
    )
    .gsapTo(m1, { opacity: 1 }, {});

  svg.select("#x-axis").gsapTo(m1, {
    attr: {
      transform: `translate(0,${
        yScale(d3.mean(dataBaseline, (d) => d.temp)) + 10
      })`,
    },
  });

  // remove anomaly axis and baseline
  svg
    .select("#baseline")
    .gsapTo(m1, { opacity: 0 }, { autoHideOnComplete: true });
  svg
    .select("#anomaly-axis")
    .gsapTo(m1, { opacity: 0 }, { autoHideOnComplete: true });
}

function drawStep7() {
  const yScale = d3
    .scaleBand()
    .range([30, viewBox.height - viewBox.padding])
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
        : d3.interpolateRdBu(calculateColorScaleValue(d.anomaly))
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

  // move x-axis to the bottm
  timeline.add(
    gsap.to("#x-axis", {
      duration: 0.5,
      attr: { transform: `translate(0,${viewBox.height - viewBox.padding})` },
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
    createTransition(
      "#filling-rects rect",
      {
        onComplete: () => {
          missingLine.attr("fill", (d) =>
            d3.interpolateRdBu(calculateColorScaleValue(d.anomaly))
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
    createTransition(
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
          svg.select("#filling-rects text").attr("opacity", 1);
        },
      }
    ),
    "<"
  );

  m1.push(timeline);
}
