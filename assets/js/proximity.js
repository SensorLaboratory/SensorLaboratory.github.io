var color = Chart.helpers.color;
var proximityConfig = {
	type: 'bar',
	data: {
    labels: [],
		datasets: [{
			label: 'Proximity',
			backgroundColor: color(window.chartColors.orange).alpha(0.5).rgbString(),
      borderColor: window.chartColors.orange,
			fill: true,
			data: [],
      tension: 0
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Proximity (depending on hardware it may be binary or cm)'
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
				ticks: {
					beginAtZero: true
				},
				scaleLabel: {
					display: true,
					labelString: 'Binary or cm'
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
var proximityDateArray = [];
var proximitySensorData = [];
var proximityInsertedRows = 0;
var timeGranularityArray = ['Hour', 'Day', 'Month', 'Year'];

function addProximityValue(chart, date, value) {
  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(value);

  return date;
}

function cleanProximityChart(chart) {
	chart.data.labels = [];
	chart.data.datasets[0].data = [];
}

function getProximityData() {
	var content = [];

	for (var i = 0; i < proximitySensorData.length; ++i) {
		var value = proximitySensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.proximity]);
	}

	return content;
}

function removeProximityListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showProximityCharts(userID, sensorName, databaseRef) {
  // Reset
	proximityDateArray = [];
  proximitySensorData = [];
  proximityInsertedRows = 0;

  var chartIDArray = ['proximity-data'];
  var chartTitleArray = ['Proximity'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, proximityConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var index = 0;
					var value = $(".js-range-slider").prop("value");
					++proximityInsertedRows;

					for (var i = 1; i < timeGranularityArray.length; ++i) {
						if (value == timeGranularityArray[i]) {
							index = i;
							break;
						}
					}

					proximitySensorData.push(snapshot);
					proximityDateArray.push(getMomentDate(snapshot.val().date));
					updateProximityChart(chart, index);
					showProximityData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanProximityChart(chart);

        snapshot.forEach((item, i) => {
					proximityDateArray.push(getMomentDate(item.val().date));
          proximitySensorData.push(item);
        });

				// Initialize chart
				updateProximityChart(chart, 0);

        addSensorTableHeader(['#', 'Timestamp', 'Proximity']);
        if (!showProximityData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					type: 'single',
					values: timeGranularityArray,
          onFinish: function (data) {
            updateProximityChart(chart, data.from);
          }
        });

				newItems = true;
      });

    }, 400);
  });
}

function showProximityData(minDataIndex, numRows, isNew) {
  if (proximitySensorData.length > 0) {
    var index = proximitySensorData.length - 1 - minDataIndex - (isNew ? 0: proximityInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, proximitySensorData[index].val().date, proximitySensorData[index].val().proximity.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateProximityChart(chart, from) {
	var epsilon = .000001;
	var dateFormat = ["YYYY/MM/DD hh a", "YYYY/MM/DD", "YYYY/MM", "YYYY"];
	var timeGranularity = [['hour', 4], ['day', 1], ['month', 1], ['year', 1]];
	var dateMap = { };

	for (var i = 0; i < proximityDateArray.length; ++i) {
		var dateFormatted = proximityDateArray[i].format(dateFormat[from]);

		if (!(dateFormatted in dateMap)) {
			dateMap[dateFormatted] = .0;
		}

		if (proximitySensorData[i].val().proximity < epsilon) {
			dateMap[dateFormatted] += 1;
		}
	}

	// Clean dataset and labels
	cleanProximityChart(chart);

	for (const [key, value] of Object.entries(dateMap)) {
		var date = moment(key, dateFormat[from]);
		addProximityValue(chart, date, value);
	}

  chart.options.scales.xAxes[0].time.round = timeGranularity[from][0];
  chart.options.scales.xAxes[0].time.unit = timeGranularity[from][0];
  chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[from][1];
	chart.options.scales.xAxes[0].time.tooltipFormat = dateFormat[from];
  chart.update();
}
