//planning to use all orginal map fucntions, and rid of orignial 'map2' functions
window.onload = function() {	
	console.log("beforeMap2");
	setMap2();
	console.log("map2compelte");
};

function setMap2() {
	//these variables are glable in function setMap
	attrArray = ["1950","1955","1960","1965","1970","1975", "1980","1985","1990","1995","2000","2005"];
	expressedAttr = "2000";

	
	var width = 500, height = 500;

	var map = d3.select(".map2Div")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	var projection = d3.geo.albers()
		.center([0, 36.33])
		.rotate([-103, 0, 0])
		.parallels([29.5, 45.17])
		.scale(650)
		.translate([width / 2, height / 2]);

	var path = d3.geo.path()
		.projection(projection);

	queue()
		.defer(d3.csv, "data/gender_ratio_chart.csv")
		.defer(d3.json, "data/ChinaProvinces.topojson")
		.defer(d3.json, "data/AsiaRegion_6simplified.topojson")
		.await(callback); //send data to callback function once finish loading

	function callback(error, csvDataDec, provData, asiaData) {
		var asiaRegion = topojson.feature(asiaData, asiaData.objects.AsiaRegion);
		var provinces = topojson.feature(provData, provData.objects.collection).features;
		setGraticule(map, path);
		map.append("path")
			.datum(asiaRegion)
			.attr("class", "backgroundCountry")
			.attr("d", path);

		
		provinces = joinData(provinces, csvDataDec);

		var colorScale = makeColorScale(csvDataDec);


		setEnumUnits(provinces, map, path, colorScale);

		var slider = createSlider();

		updateSlider(csvDataDec, slider);

	};
};

function setGraticule(map, path) {
		// svg elements drawing order is determined by the order they were added to DOM
	var graticule = d3.geo.graticule()
		.step([10, 10]); //place graticule lines every 10 degrees of longitude and latitude

	var gratBackground = map.append("path")
		.datum(graticule.outline())
		.attr("class", "gratBackground")
		.attr("d", path);

	// create graticule lines  
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
		.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
};

function joinData(provinces, csvData) {
	// join attributes from csv to geojson.
	for (var i = 0; i < csvData.length; i++) {
		var csvProv = csvData[i];
		var csvKey = csvProv.name;

		for (var a = 0; a < provinces.length; a++) {
			var jsonProps = provinces[a].properties;
			var jsonKey = jsonProps.name;

			if (jsonKey == csvKey) {
				attrArray.forEach(function(attr){
					var val = parseFloat(csvProv[attr]);
					jsonProps[attr] = Math.ceil(val);
				});
				jsonProps["region_code"] = csvProv["region_code"];
			};
		};
	};
	console.log(provinces);
	return provinces;
};

function setEnumUnits(provinces, map, path, colorScale) {
	// select all must take a list, should be a list of features, not the whole feature collection
	var enumUnits = map.selectAll(".enumUnits")
		.data(provinces)
		.enter()
		.append("path")
		.attr("class", function(d) {
			return "enumUnits " + d.properties.region_code;
		})
		.attr("d", path)
		.style("fill", function(d) {
			return choropleth(d.properties, colorScale);
		})
		.on("mouseover", function(d) {
			highlight(d.properties);
		})
		.on("mouseout", function(d) {
			dehighlight(d.properties);
		})
		.on("mousemove", moveLabel);

	var desc = enumUnits.append("desc")
		.text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

function makeColorScale(data) {
	console.log("begin mmakeColorscale");
	//data is an array of provinces
	var colorClasses = [
		"#fee5d9",
		"#fcae91",
		"#fb6a4a",
		"#de2d26",
		"#a50f15"
	];

	var colorScale = d3.scale.threshold()
		.range(colorClasses);

	//build array of all values of the expressedAttr attribute
	console.log(data);
	var domainArray = [];
	for (var i = 0; i < data.length-1; i++){ // (-1) as to not include region_code part of data

		var val = parseFloat(data[i][expressedAttr]);
		console.log(val);
		domainArray.push(val);
	};
	console.log(domainArray); //works
	//cluster data using ckmeans clustering algorithm to create natural breaks
	var clusters = ss.ckmeans(domainArray, 5); //cannot generate more classs then there are data values
	console.log("line"); //does not work
	//reset domain array to cluster minimums
	domainArray = clusters.map(function(d) {
		return d3.min(d);
	});

	//remove first value from domain array to create class breakpoints
	domainArray.shift();

	//assign array of last 4 cluster minimums as domain
	colorScale.domain(domainArray);
	console.log("colorscale compelte"); //we did not make it here
	return colorScale; 
}

// deal with enumUnits without data
function choropleth(props, colorScale) {
	//make sure attribute value is a number
	var val = parseFloat(props[expressedAttr]);
	//if attribute value exists, assign a color; otherwise assign gray
	if (val && val != NaN){
		return colorScale(val);
	} else {
		return "#CCC";
	};
};

// function setScatterPlot(csvData) {
// 	var leftPadding = 50;
// 	translate = "translate(" + leftPadding + "," + 0 + ")";//moves an element

// 	var scatterPlot = d3.select(".scatterPlotDiv")
// 		.append("svg")
// 		.attr("class", "scatterPlot")
// 		.attr("width", 600)
// 		.attr("height", 600);

// 	// var scatterPlotInnerWidth = 500,
// 	// 	scatterPlotInnerHeight = 500;
	
// 	// var scatterPlotBackground = scatterPlot.append("rect")
// 	//     .attr("class", "scatterPlotBackground")
//  //        .attr("width", scatterPlotInnerWidth)
//  //        .attr("height", scatterPlotInnerHeight)
//  //        .attr("transform", translate);

// 	updateScatterPlot(csvData);
// 	updateYAxis();
// 	updateXAxis();
// };

// //TODO: try to change scatterplot to bind to multiple year sets
// function updateScatterPlot(csvData) {
// 	d3.selectAll(".dataPoints").remove();
// 	var scatterPlot = d3.select(".scatterPlot");
// 	scatterPlot.selectAll(".dataPoints")
// 		.data(csvData)
// 		.enter()
// 		.append("circle")
// 		.attr("class", function(d) {
// 			return "dataPoints " + d.region_code;
// 		})
// 		.attr("cy", function(d) {
// 			return yScale(d[expressedAttr]);
// 		})
// 		.attr("cx", function(d) {
// 			return xScale(d["gdp_per_capita"]);
// 		})
// 		.attr("r", 5)
// 		.attr("translate", translate)
// 		.on("mouseover", highlight)
// 		.on("mouseout", dehighlight)
// 		.on("mousemove", moveLabel);
// };

// function updateYAxis() {
// 	d3.select(".yAxis").remove();
// 	var yAxis = d3.svg.axis()
// 		.scale(yScale)
// 		.orient("left");

// 	var scatterPlot = d3.select(".scatterPlot");
// 	scatterPlot.append("g")
// 		.attr("class", "yAxis")
// 		.attr("transform", translate)
// 		.call(yAxis);
// };

// function updateXAxis() {
// 	d3.select(".xAxis").remove();
// 	var xAxis = d3.svg.axis()
// 		.scale(xScale)
// 		.orient("bottom");

// 	var scatterPlot = d3.select(".scatterPlot");
// 	scatterPlot.append("g")
// 		.attr("class", "xAxis")
// 		.attr("transform", "translate(0," + 550 + ")")
// 		.call(xAxis);
// };

// function setAttrToggle(csvData) {
// 	d3.select(".form").remove();

// 	var form = d3.select(".attrToggleDiv")
// 		.append("form")
// 		.attr("class", "form");
// 	var labelEnter = form.selectAll("span")
// 		.data(attrArray)
// 		.enter().
// 		append("span");
// 	labelEnter.append("input")
// 		.attr("type", "radio")
// 		.attr("name", "attr")
// 		.attr("value", function(d, i) {return i;})
// 		.attr("checked", function(d) { //set the initially checked button
// 			if (d == expressedAttr) {
// 				return "checked";
// 			}
// 		})
// 		.on("change", function(){
// 			expressedAttr = attrArray[this.value];
// 			updateEnumUnits(csvData);
// 			updateYScale(csvData);
// 			updateScatterPlot(csvData);
// 			updateYAxis();
// 		});
// 	labelEnter.append("label").text(function(d) {return d;});
// };

function updateEnumUnits(csvData) {
	var colorScale = makeColorScale(csvData);
	d3.selectAll(".enumUnits")
		.transition()
		.duration(1000)
		.style("fill", function(d) {
			return choropleth(d.properties, colorScale);
		});
};

// function updateYScale(csvData) {
// 	//change range to be
// 	//min of expressedAttr attribute
// 	//max of expressedAttr attribute
// 	var maxVal = 0;
// 	var minVal = 10000;
// 	for (var i = 0; i < csvData.length; i++) {
// 		var currExpressedVal = Math.ceil(csvData[i][expressedAttr]);
// 		if (currExpressedVal < minVal) {
// 			minVal = currExpressedVal;
// 		};
// 		if (currExpressedVal > maxVal) {
// 			maxVal = currExpressedVal;
// 		};
// 	};

// 	yScale = d3.scale.linear()
// 		.range([20, 550])
// 		.domain([maxVal + 5, minVal - 5]);

// };

// function updateXScale(csvData) {
// 	var maxGDP = 0;
// 	var minGDP = 1000000;
// 	for (var i = 0; i < csvData.length; i++) {
// 		var currGDP = parseInt(csvData[i]["gdp_per_capita"]);
// 		if (currGDP < minGDP) {
// 			minGDP = currGDP;
// 		};
// 		if (currGDP > maxGDP) {
// 			maxGDP = currGDP;
// 		};
// 	};

// 	xScale = d3.scale.linear()
// 		.range([50, 580])
// 		.domain([minGDP - 100, maxGDP + 100])
// };

// function setYearToggle(yearArray) {
// 	var form = d3.select(".yearToggleDiv").append("form");
// 	var labelEnter = form.selectAll("span")
// 		.data(yearArray)
// 		.enter().
// 		append("span");
// 	labelEnter.append("input")
// 		.attr("type", "radio")
// 		.attr("name", "year")
// 		.attr("value", function(d, i) {return i;})
// 		.attr("checked", function(d) { //set the initially checked button
// 			if (d == 2000) {
// 				return "checked";
// 			}
// 		})
// 		.on("change", function(){
// 			changeYear(this.value);
// 		})
// 	labelEnter.append("label").text(function(d) {return d;});
// };

// function changeYear(yearIndex) {
// 	expressedAttr = attrArray[yearIndex];
// 	updateEnumUnits(csvDataDec);
// 	// updateYScale(csvDataDec);
// 	// updateXScale(csvData);
// 	// updateYAxis();
// 	// updateXAxis();
// 	// updateScatterPlot(csvData);
// 	//reset attribute toggle so that the new form is based on current csvData
// 	// setAttrToggle(csvData);
// };

function highlight(props) {
	//!!This selection won't work for names with multiple space
	d3.selectAll("." + props.region_code)
		.style({
			"stroke": "blue",
			"stroke-width": "2"
		});

	setLabel(props);
}

function dehighlight(props) {
	d3.selectAll("." + props.region_code)
		.style("stroke", "#000")
		.style("stroke-width", "0.5px");

	// d3.selectAll("." + props.region_code)
	// 	.style({
	// 		"stroke": function() {
	// 			return getStyle(this, "stroke")
	// 		},
	// 		"stroke-width": function() {
	// 			console.log(getStyle(this, "stroke-width"));

	// 			return getStyle(this, "stroke-width")
	// 		}
	// 	});

	// function getStyle(element, styleName) {
	// 	var styleText = d3.select(element)
	// 		.select("desc")
	// 		.text();
	// 	var styleObject = JSON.parse(styleText);
	// 	console.log(styleObject);
	// 	return styleObject[styleName];
	// };

	d3.select(".infolabel").remove();
};

//set label, now is appended to body as div
function setLabel(props) {
	//different type of labels for different attributes
	var labelAttribute;
	if (!props[expressedAttr]) {
		labelAttribute = "<h1>" + "Nodata" + "</h1><b>" + "</b>";
	} else {
		labelAttribute = "<h1>" + Math.ceil(props[expressedAttr]) +
		"</h1><b>" + "</b>";
	};

	//create info label div
	var infolabel = d3.select("body")
		.append("div")
		.attr({
			"class": "infolabel",
			"id": props.region_code + "_label"
		})
		.html(labelAttribute);

	infolabel.append("div")
		.attr("class", "labelname")
		.html(props.name);
};

//move info label with mouse
function moveLabel() {
	var labelWidth = d3.select(".infolabel")
		.node()
		.getBoundingClientRect()
		.width;
	//clientXY gives the coordinates relative to current window, will be problematic when scrolling
	//pageXY gives the coordinates relative to the whole rendered page, including hidden part after scrolling
	var x1 = d3.event.pageX + 10,
		y1 = d3.event.pageY - 75,
		x2 = d3.event.pageX - labelWidth - 10,
		y2 = d3.event.pageY + 25;

	//horizontal label coordinate, testing for overflow
	var x = d3.event.pageX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
	//vertical label coordinate, testing for overflow
	var y = d3.event.pageY < 75 ? y2 : y1;

	d3.select(".infolabel")
		.style({
			"left": x + "px",
			"top": y + "px"
		});
};

function createSlider() {
	var slider = d3.slider().axis(true).min(1950).max(2005).step(5);
	//var slider = d3.slider().rangePoints([1950,2005], 5);





	d3.select("#slider").call(slider);

	return slider;

};

function updateSlider(csvData, slider) {

			slider.on("slide", function(evt, value) {
		 	console.log("sliding"); // change values
		 	var yearIndex =value;
		 	console.log(attrArray);
		 	console.log(yearIndex);
		 	expressedAttr = attrArray[yearIndex];
			//updateEnumUnits(csvDataDec);
		});



	//d3.select("#slider").call(slider);
}