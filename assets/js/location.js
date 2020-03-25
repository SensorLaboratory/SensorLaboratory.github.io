var color = Chart.helpers.color;
var locationConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Distance in meters',
			backgroundColor: color(window.chartColors.purple).alpha(0.5).rgbString(),
      borderColor: window.chartColors.purple,
			borderWidth: 1,
			fill: true,
			tension: 0.1,
			data: []
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Distance runned'
    },
		scales: {
			xAxes: [{
				offset: true,
				type: 'time',
				time: {
          round: 'millisecond',
					tooltipFormat: 'll HH:mm:ss:SSS',
          unit: 'second',
          unitStepSize: 3
				},
				scaleLabel: {
					display: true,
					labelString: 'Time'
				}
			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'Meters'
				}
			}]
		},
    animation: {
      duration: 500
    },
		responsive: true,
	 	maintainAspectRatio: false
	}
};

// Sensor date
var locationDateArray = [];
var locationSensorData = [];
var locationInsertedRows = 0;
var timeGranularityArray = ['Hour', 'Day', 'Month', 'Year'];

function addLocationValue(chart, date, value) {
  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(value);

  return date;
}

function cleanLocationChart(chart) {
	chart.data.labels = [];
	chart.data.datasets[0].data = [];
}

function getLocationData() {
	var content = [];

	for (var i = 0; i < locationSensorData.length; ++i) {
		var value = locationSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.latitude, value.longitude, value.utm_easting, value.utm_northing, value.zone]);
	}

	return content;
}

function getPositionDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.val().utm_easting - pos2.val().utm_easting, 2) + Math.pow(pos1.val().utm_northing - pos2.val().utm_northing, 2));
}

function removeLocationListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showLocationCharts(userID, sensorName, databaseRef) {
  // Reset
	locationDateArray = [];
  locationSensorData = [];
  locationInsertedRows = 0;

  var chartIDArray = ['distance-data'];
  var chartTitleArray = ['Distance per time'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, locationConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var index = 0;
					var value = $(".js-range-slider").prop("value");
					++locationInsertedRows;

					for (var i = 1; i < timeGranularityArray.length; ++i) {
						if (value == timeGranularityArray[i]) {
							index = i;
							break;
						}
					}

					locationSensorData.push(snapshot);
					locationDateArray.push(getMomentDate(snapshot.val().date));
					updateLocationChart(chart, index);
					showLocationData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanLocationChart(chart);

        snapshot.forEach((item, i) => {
					locationDateArray.push(getMomentDate(item.val().date));
          locationSensorData.push(item);
        });

				// Initialize chart
				updateLocationChart(chart, 0);

        addSensorTableHeader(['#', 'Timestamp', 'Latitude', 'Longitude']);
        if (!showLocationData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					type: 'single',
					values: timeGranularityArray,
          onFinish: function (data) {
            updateLocationChart(chart, data.from);
          }
        });

				newItems = true;
      });

    }, 500);
  });
}

function showLocationData(minDataIndex, numRows, isNew) {
  if (locationSensorData.length > 0) {
    var index = locationSensorData.length - 1 - minDataIndex - (isNew ? 0: locationInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, locationSensorData[index].val().date, locationSensorData[index].val().latitude.toFixed(4), locationSensorData[index].val().longitude.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateLocationChart(chart, from) {
	var epsilon = .000001;
	var dateFormat = ["YYYY/MM/DD hh a", "YYYY/MM/DD", "YYYY/MM", "YYYY"];
	var timeGranularity = [['hour', 4], ['day', 1], ['month', 1], ['year', 1]];
	var dateMap = { };
  var lastPositionMap = { };

	for (var i = 0; i < locationDateArray.length; ++i) {
		var dateFormatted = locationDateArray[i].format(dateFormat[from]);

		if (!(dateFormatted in dateMap)) {
			dateMap[dateFormatted] = .0;
      lastPositionMap[dateFormatted] = null;
		}

    var lastPosition = lastPositionMap[dateFormatted];

    if (lastPosition != null) {
      var distance = getPositionDistance(locationSensorData[i], lastPosition);
      dateMap[dateFormatted] += distance;
    }

    lastPositionMap[dateFormatted] = locationSensorData[i];
	}

	// Clean dataset and labels
	cleanLocationChart(chart);

	for (const [key, value] of Object.entries(dateMap)) {
		var date = moment(key, dateFormat[from]);
		addLocationValue(chart, date, value);
	}

  chart.options.scales.xAxes[0].time.round = timeGranularity[from][0];
  chart.options.scales.xAxes[0].time.unit = timeGranularity[from][0];
  chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[from][1];
	chart.options.scales.xAxes[0].time.tooltipFormat = dateFormat[from];
  chart.update();
}
