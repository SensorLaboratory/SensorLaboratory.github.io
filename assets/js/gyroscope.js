var color = Chart.helpers.color;
var gyroscopeConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Rotation around X',
			backgroundColor: color(window.chartColors.red).rgbString(),
      borderColor: window.chartColors.red,
			fill: false,
			tension: 0.2,
			data: [],
		}, {
			label: 'Rotation around Y',
			backgroundColor: color(window.chartColors.blue).rgbString(),
			borderColor: window.chartColors.blue,
			fill: false,
			tension: 0.2,
		  data: [],
		}, {
			label: 'Rotation around Z',
			backgroundColor: color(window.chartColors.green).rgbString(),
			borderColor: window.chartColors.green,
			fill: false,
			tension: 0.2,
			data: [],
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Gyroscope rotation around a device’s x, y and z axis'
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
					labelString: 'rad/s'
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
var gyroscopeDateArray = [];
var gyroscopeSensorData = [];
var gyroscopeInsertedRows = 0;

function addGyroscopeValue(chart, item) {
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

function cleanGyroscopeChart(chart) {
	chart.data.labels = [];
	chart.data.datasets[0].data = [];
	chart.data.datasets[1].data = [];
	chart.data.datasets[2].data = [];
}

function getGyroscopeData() {
	var content = [];

	for (var i = 0; i < gyroscopeSensorData.length; ++i) {
		var value = gyroscopeSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.x, value.y, value.z]);
	}

	return content;
}

function removeGyroscopeListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showGyroscopeCharts(userID, sensorName, databaseRef) {
  // Reset
	gyroscopeDateArray = [];
  gyroscopeSensorData = [];
  gyroscopeInsertedRows = 0;

  var chartIDArray = ['gyroscope-axes'];
  var chartTitleArray = ['Rotation'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, gyroscopeConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++gyroscopeInsertedRows;

					gyroscopeSensorData.push(snapshot);
					updateGyroscopeChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showGyroscopeData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanGyroscopeChart(chart);

        snapshot.forEach((item, i) => {
          gyroscopeDateArray.push(addGyroscopeValue(chart, item));
          gyroscopeSensorData.push(item);
        });

        if (gyroscopeDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(gyroscopeDateArray[0], gyroscopeDateArray[gyroscopeDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'x', 'y', 'z']);
        if (!showGyroscopeData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateGyroscopeChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 200);
  });
}

function showGyroscopeData(minDataIndex, numRows, isNew) {
  if (gyroscopeSensorData.length > 0) {
    var index = gyroscopeSensorData.length - 1 - minDataIndex - (isNew ? 0: gyroscopeInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, gyroscopeSensorData[index].val().date, gyroscopeSensorData[index].val().x.toFixed(4), gyroscopeSensorData[index].val().y.toFixed(4), gyroscopeSensorData[index].val().z.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateGyroscopeChart(chart, from, to) {
  var length = gyroscopeSensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentGyroscopeDateArray = [];
  cleanGyroscopeChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentGyroscopeDateArray.push(addGyroscopeValue(chart, gyroscopeSensorData[i]));
  }

  if (currentGyroscopeDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentGyroscopeDateArray[0], currentGyroscopeDateArray[currentGyroscopeDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
