var color = Chart.helpers.color;
var accelerometerConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Acceleration in X',
			backgroundColor: color(window.chartColors.red).rgbString(),
      borderColor: window.chartColors.red,
			fill: false,
			tension: 0.1,
			data: [],
		}, {
			label: 'Acceleration in Y',
			backgroundColor: color(window.chartColors.blue).rgbString(),
			borderColor: window.chartColors.blue,
			fill: false,
			tension: 0.1,
		  data: [],
		}, {
			label: 'Acceleration in Z',
			backgroundColor: color(window.chartColors.green).rgbString(),
			borderColor: window.chartColors.green,
			fill: false,
			tension: 0.1,
			data: [],
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Acceleration applied in X, Y, Z'
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
					labelString: 'm/s²'
				}
			}]
		},
    animation: {
      duration: 1000
    },
		responsive: true,
	 	maintainAspectRatio: false
	}
};

// Sensor date
var accelerometerDateArray = [];
var accelerometerSensorData = [];
var accelerometerInsertedRows = 0;

function addAccelerometerValue(chart, item) {
  var x = item.val().x;
  var y = item.val().y;
  var z = item.val().z;
  var date = getMomentDate(item.val().date);

  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(x);
  chart.data.datasets[1].data.push(y);
  chart.data.datasets[2].data.push(z);

  return date;
}

function cleanAccelerometerChart(chart) {
	chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  chart.data.datasets[2].data = [];
}

function getAccelerometerData() {
	var content = [];

	for (var i = 0; i < accelerometerSensorData.length; ++i) {
		var value = accelerometerSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.x, value.y, value.z]);
	}

	return content;
}

function removeAccelerometerListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showAccelerometerCharts(userID, sensorName, databaseRef) {
  // Reset
	accelerometerDateArray = [];
  accelerometerSensorData = [];
  accelerometerInsertedRows = 0;

  var chartIDArray = ['accelerometer-axes'];
  var chartTitleArray = ['Acceleration'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, accelerometerConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++accelerometerInsertedRows;

					accelerometerSensorData.push(snapshot);
					updateAccelerometerChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showAccelerometerData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanAccelerometerChart(chart);

        snapshot.forEach((item, i) => {
          accelerometerDateArray.push(addAccelerometerValue(chart, item));
          accelerometerSensorData.push(item);
        });

        if (accelerometerDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(accelerometerDateArray[0], accelerometerDateArray[accelerometerDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'x', 'y', 'z']);
        if (!showAccelerometerData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateAccelerometerChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 100);
  });
}

function showAccelerometerData(minDataIndex, numRows, isNew) {
  if (accelerometerSensorData.length > 0) {
    var index = accelerometerSensorData.length - 1 - minDataIndex - (isNew ? 0: accelerometerInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, accelerometerSensorData[index].val().date, accelerometerSensorData[index].val().x.toFixed(4), accelerometerSensorData[index].val().y.toFixed(4), accelerometerSensorData[index].val().z.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateAccelerometerChart(chart, from, to) {
  var length = accelerometerSensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentAccelerometerDateArray = [];
	cleanAccelerometerChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentAccelerometerDateArray.push(addAccelerometerValue(chart, accelerometerSensorData[i]));
  }

  if (currentAccelerometerDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentAccelerometerDateArray[0], currentAccelerometerDateArray[currentAccelerometerDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
