import { createTransition, TransitionsManager } from "./helper_functions.js";
let dataBaseline, data, viewBox, svg, xScale, yScale, dataToCoCompareTo, calculateColorScaleValue;
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
  }


  dataToCoCompareTo = data.filter((e) => e.year === 1878);

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
    .range([viewBox.height - viewBox.padding, 150]) // add half stroke width
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
  document.getElementById("step-0").focus();
  const numberOfSteps = drawFunctions.length;

  //prev and next button
  d3.selectAll(".nav-button").on("click", function () {
    const id = d3.select(this).attr("id");
    if (id === "next" && m1.getStep() < numberOfSteps - 1) {
      m1.drawNextStep();
    } else if (id === "prev" && m1.getStep() > 0) {
      m1.drawPrevStep();
    }
    document.getElementById("step-" + m1.getStep()).focus();
  });

  // step buttons
  for (let i = 0; i < numberOfSteps; i++) {
    d3.selectAll("#step-" + i).on("click", function () {
      m1.drawStep(i);
    });
  }
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
    .attr("stroke-width", 3);

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
    .attr("stroke-width", 3);

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
  svg.select("#baseline").gsapTo(m1, { attr: { d: blueMeanPath } });

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
  svg.select("#redPath").gsapTo(m1, { attr: { d: newRedPath }, opacity: 0 });

  // transition filling rects
  svg.selectAll("#filling-rects rect").gsapTo(m1, (d, i) => {
    const temp = dataBaseline[i].temp + d.anomaly;
    if (dataBaseline[i].temp > temp) {
      return { attr: { y: yScale(mean) + 1.5 } };
    } else {
      return { attr: { y: yScale(mean + d.anomaly) - 1.5 } };
    }
  });

  svg
    .selectAll("#filling-rects rect")
    .gsapTo(m1, { attr: { fill: "#ff000050" } });

  // transition y-axis
  d3.select("#y-axis").gsapTo(m1, { opacity: 0 });

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
  d3.select("#x-axis").gsapTo(m1, {
    attr: {
      transform: `translate(0,${yScale(
        mean + d3.min(dataToCoCompareTo, (d) => d.anomaly)
      )})`,
    },
  });
}

function drawStep52() {

  d3.selectAll("#filling-rects rect").gsapTo(m1, (d, i) => {
    return {
      attr: {
        fill: d3.interpolateRdBu(calculateColorScaleValue(d.anomaly)),
      },
    };
  });
}

function drawStep6() {
  // transition filling rects to all have the same height
  d3.selectAll("#filling-rects rect").gsapTo(m1, {
    attr: {
      y: yScale(d3.mean(dataBaseline, (d, i) => dataBaseline[i].temp)) - 10,
      height: 20,
    },
  });
  d3.select("#x-axis").gsapTo(m1, {
    attr: {
      transform: `translate(0,${
        yScale(d3.mean(dataBaseline, (d) => d.temp)) + 10
      })`,
    },
  });

  // remove anomaly axis and baseline
  d3.select("#baseline").gsapTo(m1, { opacity: 0 });
  d3.select("#anomaly-axis").gsapTo(m1, { opacity: 0 });
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

  yearGroups
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "black");
      d3.select(this).select("text").attr("opacity", 1);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).attr("stroke", null);

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
      d.year === 1878
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
    gsap.to(".year-group", { attr: { opacity: 1 }, stagger: 0.004 })
  );

  d3.select("#filling-rects").raise(); // move to front
  const missingLine = yearGroups.filter((d) => d === "1878").selectAll("rect");

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
        attr: { y: yScale(1878), height: yScale.bandwidth() },
      },
      { autoHideOnComplete: true,
      onReverseStart: () => missingLine.attr("fill", "#808080") }
    )
  );
  m1.push(timeline);
}
