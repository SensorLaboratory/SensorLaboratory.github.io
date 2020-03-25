var color = Chart.helpers.color;
var ambientNoiseConfig = {
	type: 'bar',
	data: {
    labels: [],
		datasets: [{
			label: 'Noise events',
			backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
      borderColor: window.chartColors.blue,
			fill: true,
			data: [],
      tension: 0
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Ambient noise in terms of noise events and average dB'
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
					labelString: 'Number of noise events'
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

var noiseAverageConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Noise events',
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
      text: 'Ambient noise in terms of noise events and average dB'
    },
		scales: {
			xAxes: [{
				offset: false,
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
					labelString: 'Number of noise events'
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
var ambientNoiseDateArray = [];
var ambientNoiseSensorData = [];
var ambientNoiseInsertedRows = 0;
var timeGranularityArray = ['Hour', 'Day', 'Month', 'Year'];

function addAmbientNoiseValue(chart, date, value) {
  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(value);

  return date;
}

function getAmbientNoiseData() {
	var content = [];

	for (var i = 0; i < ambientNoiseSensorData.length; ++i) {
		var value = ambientNoiseSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.decibels, value.threshold]);
	}

	return content;
}

function removeAmbientNoiseListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showAmbientNoiseCharts(userID, sensorName, databaseRef) {
  // Reset
	ambientNoiseDateArray = [];
  ambientNoiseSensorData = [];
  sensorArray = [];
  ambientNoiseInsertedRows = 0;

  var chartIDArray = ['ambient-noise-data', 'average-db-data'];
  var chartTitleArray = ['Ambient noise', 'Average decibels'];

  loadChartsRows(2, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
			var newItems = false;

      var ctx1 = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var recountChart = new Chart(ctx1, ambientNoiseConfig);

			var ctx2 = $('#' + chartIDArray[1]).find('canvas')[0].getContext('2d');
			var averageChart = new Chart(ctx2, noiseAverageConfig);

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					++ambientNoiseInsertedRows;

					ambientNoiseSensorData.push(snapshot);
					ambientNoiseDateArray.push(getMomentDate(snapshot.val().date));

					updateBinaryChart(chartIDArray[0], recountChart);
					updateDecibelsChart(chartIDArray[1], averageChart);

					showAmbientNoiseData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
        snapshot.forEach((item, i) => {
					ambientNoiseDateArray.push(getMomentDate(item.val().date));
          ambientNoiseSensorData.push(item);
        });

				// Initialize recountChart
				updateAmbientNoiseChart(recountChart, 0);
				updateAverageDecibelsChart(averageChart, 0);

        addSensorTableHeader(['#', 'Timestamp', 'Decibels', 'Threshold']);
        if (!showAmbientNoiseData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $('#' + chartIDArray[0]).find(".js-range-slider").ionRangeSlider({
					type: 'single',
					values: timeGranularityArray,
          onFinish: function (data) {
            updateAmbientNoiseChart(recountChart, data.from);
          }
        });

				$('#' + chartIDArray[1]).find(".js-range-slider").ionRangeSlider({
					type: 'single',
					values: timeGranularityArray,
          onFinish: function (data) {
            updateAverageDecibelsChart(averageChart, data.from);
          }
        });

				newItems = true;
      });

    }, 400);
  });
}

function showAmbientNoiseData(minDataIndex, numRows, isNew) {
  if (ambientNoiseSensorData.length > 0) {
    var index = ambientNoiseSensorData.length - 1 - minDataIndex - (isNew ? 0: ambientNoiseInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, ambientNoiseSensorData[index].val().date, ambientNoiseSensorData[index].val().decibels.toFixed(4), ambientNoiseSensorData[index].val().threshold], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateAmbientNoiseChart(recountChart, from) {
	var dateFormat = ["YYYY/MM/DD hh a", "YYYY/MM/DD", "YYYY/MM", "YYYY"];
	var timeGranularity = [['hour', 1], ['day', 1], ['month', 1], ['year', 1]];
	var dateMap = { };

	for (var i = 0; i < ambientNoiseDateArray.length; ++i) {
		var dateFormatted = ambientNoiseDateArray[i].format(dateFormat[from]);

		if (!(dateFormatted in dateMap)) {
			dateMap[dateFormatted] = .0;
		}

		dateMap[dateFormatted] += 1;
	}

	// Clean dataset and labels
	recountChart.data.labels = [];
	recountChart.data.datasets[0].data = [];

	for (const [key, value] of Object.entries(dateMap)) {
		var date = moment(key, dateFormat[from]);
		addAmbientNoiseValue(recountChart, date, value);
	}

  recountChart.options.scales.xAxes[0].time.round = timeGranularity[from][0];
  recountChart.options.scales.xAxes[0].time.unit = timeGranularity[from][0];
  recountChart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[from][1];
	recountChart.options.scales.xAxes[0].time.tooltipFormat = dateFormat[from];
  recountChart.update();
}

function updateAverageDecibelsChart(averageChart, from) {
	var dateFormat = ["YYYY/MM/DD hh a", "YYYY/MM/DD", "YYYY/MM", "YYYY"];
	var timeGranularity = [['hour', 1], ['day', 1], ['month', 1], ['year', 1]];
	var dateSumMap = { };
	var dateNumMap = { };

	for (var i = 0; i < ambientNoiseDateArray.length; ++i) {
		var dateFormatted = ambientNoiseDateArray[i].format(dateFormat[from]);

		if (!(dateFormatted in dateSumMap)) {
			dateSumMap[dateFormatted] = .0;
			dateNumMap[dateFormatted] = .0;
		}

		dateSumMap[dateFormatted] += ambientNoiseSensorData[i].val().decibels;
		dateNumMap[dateFormatted] += 1;
	}

	// Clean dataset and labels
	averageChart.data.labels = [];
	averageChart.data.datasets[0].data = [];

	for (const [key, value] of Object.entries(dateSumMap)) {
		var date = moment(key, dateFormat[from]);
		addAmbientNoiseValue(averageChart, date, (value / dateNumMap[key]).toFixed(4));
	}

  averageChart.options.scales.xAxes[0].time.round = timeGranularity[from][0];
  averageChart.options.scales.xAxes[0].time.unit = timeGranularity[from][0];
  averageChart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[from][1];
	averageChart.options.scales.xAxes[0].time.tooltipFormat = dateFormat[from];
	averageChart.options.scales.xAxes[0].offset = from > 0;
  averageChart.update();
}

function updateBinaryChart(chartID, chart) {
	var index = 0;
  var value = $('#' + chartID).find(".js-range-slider").prop("value");

	for (var i = 1; i < timeGranularityArray.length; ++i) {
		if (value == timeGranularityArray[i]) {
			index = i;
			break;
		}
	}

	updateAmbientNoiseChart(chart, index);
}

function updateDecibelsChart(chartID, chart) {
	var index = 0;
  var value = $('#' + chartID).find(".js-range-slider").prop("value");

	for (var i = 1; i < timeGranularityArray.length; ++i) {
		if (value == timeGranularityArray[i]) {
			index = i;
			break;
		}
	}

	updateAverageDecibelsChart(chart, index);
}
