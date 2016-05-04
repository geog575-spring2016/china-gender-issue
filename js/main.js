window.onload = function() {
	//setMap();
   setMap2();
   d3.select("body")
   	.append("div")
   	.attr("id", "slider");
   var slider = d3.slider().axis(true).min(1950).max(2000).step(5)
    .on("slide", function() {
    	console.log("sliding");
    });

   d3.select("#slider").call(slider);

};

function setMap() {
	attrArray = ["urban_unmarried_m_f","rural_unmarried_m_f","urban_newborn_m_f","rural_newborn_m_f"];
	expressed = "urban_unmarried_m_f";

	var width = 600, height = 500;

	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	var projection = d3.geo.albers()
		.center([0, 36.33])
		.rotate([-103, 0, 0])
		.parallels([29.5, 45.17])
		.scale(750)
		.translate([width / 2, height / 2]);

	var path = d3.geo.path()
		.projection(projection);

	queue()
		.defer(d3.csv, "data/gender_ratio2000.csv")
		.defer(d3.json, "data/ChinaProvinces.topojson")
		.defer(d3.json, "data/AsiaRegion_6simplified.topojson")
		.await(callback); //send data to callback function once finish loading

	function callback(error, csvData, provData, asiaData) {
		var asiaRegion = topojson.feature(asiaData, asiaData.objects.AsiaRegion);
		var provinces = topojson.feature(provData, provData.objects.collection).features;
		// new provinces with added attributes joined
		provinces = joinData(provinces, csvData);
		setGraticule(map, path);

        map.append("path")
        	.datum(asiaRegion)
        	.attr("class", "backgroundCountry")
        	.attr("d", path);

        var colorScale = makeColorScale(csvData);
		setEnumUnits(provinces, map, path, colorScale);

		// setChart(csvData, colorScale);
		// createDropdown(csvData);
		console.log(csvData);
		setScatterPlot(csvData);

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
		// .on("mouseover", function(d) {
		// 	highlight(d.properties);
		// })
		// .on("mouseout", function(d) {
		// 	dehighlight(d.properties);
		// })
		// .on("mousemove", moveLabel);

	var desc = enumUnits.append("desc")
		.text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

function makeColorScale(data) {
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

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i = 0; i < data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();
    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale; 
}

// deal with enumUnits without data
function choropleth(props, colorScale) {
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (val && val != NaN){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

function setScatterPlot(csvData) {
	var scale = d3.scale.linear()
		.range([20, 480])
		.domain([100, 200]);

	var scatterPlot = d3.select("body")
		.append("svg")
		.attr("width", 500)
		.attr("height", 500);

	var dataPoints = scatterPlot.selectAll(".dataPoints")
		.data(csvData)
		.enter()
		.append("circle")
		.attr("cy", function(d) {
			//TODO: adjust location of data points
			return scale(d[expressed]);
		})
		.attr("cx", function(d) {
			return scale(d["rural_unmarried_m_f"]);
		})
		.attr("r", 3);
};
////////////////////////////////////////////////////////
//this has problems...
function setLineChart(csvData){     //line graph idea can be viewed here:   http://bl.ocks.org/mbostock/4b66c0d9be9a0d56484e
    //http://bl.ocks.org/mbostock/8033015 "Multi-Line Voronoi"
 	var scale = d3.scale.linear()
		.range([20, 480])
		.domain([100, 200]);
    
    var lineFunction = d3.svg.line()
        .x(function(d) {return d.x; })
        .y(function(d) {return d.y; })
        .interpolate("linear");

	var lineChartContainer = d3.select("body")
		.append("svg")
		.attr("width", 960)
		.attr("height", 500);

    var lineChart = d3.select("body").append("path")
        .attr("d", lineFunction(csvData[expressed]))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    
    var points = lineChart.selectAll(".points")
        .data(csvData)
        .enter()
        .append("circle")
		.attr("cy", function(d) {
			//TODO: adjust location of data points
			return scale(d[expressed]);
		})
		.attr("cx", function(d) {
			return scale(d["1950"]);
		})
		.attr("r", 3);
    var lines = lineChart.selectAll(".lines")
        .data(csvData)
        .enter().append("line") 
        .style("stroke", "gray")
        .attr("cy", function(d){
            return lineFunction(d[expressed]);
        })
        .attr("cx", function(d) {
            return lineFunction(d[expressed]);
        })
        .attr("r",3);
};

function setMap2() {
    //choropleth map with time slider (for total population), changes ever year with line graph 
    //line graph idea can be viewed here:   http://bl.ocks.org/mbostock/4b66c0d9be9a0d56484e
	attrArray = ["1950","1955","1960","1965","1970","1975","1980","1985","1990","1995","2000","2005"];
	expressed = "1980";

	var width = 600, height = 500;

	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	var projection = d3.geo.albers()
		.center([0, 36.33])
		.rotate([-103, 0, 0])
		.parallels([29.5, 45.17])
		.scale(750)
		.translate([width / 2, height / 2]);

	var path = d3.geo.path()
		.projection(projection);      

	queue()
		.defer(d3.csv, "data/gender_ratio_dec.csv")
		.defer(d3.json, "data/ChinaProvinces.topojson")
		.defer(d3.json, "data/AsiaRegion_6simplified.topojson")
		.await(callback); //send data to callback function once finish loading
    
	function callback(error, csvData, provData, asiaData) { //n
		var asiaRegion = topojson.feature(asiaData, asiaData.objects.AsiaRegion);
		var provinces = topojson.feature(provData, provData.objects.collection).features;
		// new provinces with added attributes joined
		provinces = joinData(provinces, csvData);
		//setGraticule(map, path);

        map.append("path")
        	.datum(asiaRegion)
        	.attr("class", "backgroundCountry")
        	.attr("d", path);

        var colorScale = makeColorScale(csvData);
        console.log(colorScale);
		setEnumUnits(provinces, map, path, colorScale);

	//	setChart(csvData, colorScale); //not yet implemented
	//	createDropdown(csvData);    //not yet implemented
		console.log(csvData);



	//Slider bar called here

	//createSlider(csvData);
  //setLineChart(csvData); //linegraph implemented here
    }
};
