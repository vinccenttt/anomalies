export function setUpNavigation(manager, numberOfViews) {
  d3.select("#step-0").node().focus();

  // prev and next button
  d3.selectAll("#prev, #next").on("click", function () {
    const id = d3.select(this).attr("id");
    if (id === "next") {
      next();
    } else if (id === "prev") {
      prev();
    }
    colorButtons();
  });

  // arrow keys
  d3.select("body").on("keydown", function (event) {
    if (event.keyCode === 39) {
      next();
      colorButtons();
    }

    if (event.keyCode === 37) {
      prev();
      colorButtons();
    }
  });

  // step buttons
  for (let i = 0; i < numberOfViews; i++) {
    d3.selectAll("#step-" + i).on("click", function () {
      manager.drawView(i);
      showText(manager);
      colorButtons();
    });
  }

  const next = () => {
    manager.drawNextView();
    showText(manager);
  };

  const prev = () => {
    manager.drawPrevView();
    showText(manager);
  };

  const colorButtons = () => {
    d3.selectAll(".step-button").node().blur();
    d3.select("#step-" + manager.getCurrentViewNumber())
      .node()
      .focus();
  };

  //selector
  // d3.select("#selector").on("change", (event) => onSelect(event))
  // function onSelect(event) {
  //   m1.drawStep(event.target.value);
  // }
}

export function showText(manager) {
  d3.selectAll("#text-div .text").style("display", "none");
  d3.select("#text-" + manager.getCurrentViewNumber()).style(
    "display",
    "inline"
  );
}
