var color = Chart.helpers.color;
var barometerConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Ambient air pressure in mbar/hPa',
			backgroundColor: color(window.chartColors.yellow).alpha(0.5).rgbString(),
      borderColor: window.chartColors.yellow,
			fill: true,
			data: [],
      tension: 0
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Ambient air pressure'
    },
		scales: {
			xAxes: [{
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
					labelString: 'mbar/hPa'
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
var barometerDateArray = [];
var barometerSensorData = [];
var barometerInsertedRows = 0;

function addBarometerValue(chart, item) {
  var pressure = item.val().pressure;
  var date = getMomentDate(item.val().date);

  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(pressure);

  return date;
}

function cleanBarometerChart(chart) {
	chart.data.labels = [];
  chart.data.datasets[0].data = [];
}

function getBarometerData() {
	var content = [];

	for (var i = 0; i < barometerSensorData.length; ++i) {
		var value = barometerSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.pressure]);
	}

	return content;
}

function removeBarometerListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showBarometerCharts(userID, sensorName, databaseRef) {
  // Reset
	barometerDateArray = [];
  barometerSensorData = [];
  barometerInsertedRows = 0;

  var chartIDArray = ['barometer-pressure'];
  var chartTitleArray = ['Ambient air pressure'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, barometerConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++barometerInsertedRows;

					barometerSensorData.push(snapshot);
					updateBarometerChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showBarometerData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanBarometerChart(chart);

        snapshot.forEach((item, i) => {
          barometerDateArray.push(addBarometerValue(chart, item));
          barometerSensorData.push(item);
        });

        if (barometerDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(barometerDateArray[0], barometerDateArray[barometerDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'Pressure']);
        if (!showBarometerData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateBarometerChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 200);
  });
}

function showBarometerData(minDataIndex, numRows, isNew) {
  if (barometerSensorData.length > 0) {
    var index = barometerSensorData.length - 1 - minDataIndex - (isNew ? 0: barometerInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, barometerSensorData[index].val().date, barometerSensorData[index].val().pressure.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateBarometerChart(chart, from, to) {
  var length = barometerSensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentBarometerDateArray = [];
	cleanBarometerChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentBarometerDateArray.push(addBarometerValue(chart, barometerSensorData[i]));
  }

  if (currentBarometerDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentBarometerDateArray[0], currentBarometerDateArray[currentBarometerDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
