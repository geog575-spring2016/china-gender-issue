window.onload = function() {
	setMap();
	//may add other functions to implement other elements here
};

function setMap() {
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

	};
};

