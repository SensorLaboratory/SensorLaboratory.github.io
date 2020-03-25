var color = Chart.helpers.color;
var magnetometerConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Geomagnetic field strength in X',
			backgroundColor: color(window.chartColors.red).rgbString(),
      borderColor: window.chartColors.red,
			fill: false,
			tension: 0.2,
			data: [],
		}, {
			label: 'Geomagnetic field strength in Y',
			backgroundColor: color(window.chartColors.blue).rgbString(),
			borderColor: window.chartColors.blue,
			fill: false,
			tension: 0.2,
		  data: [],
		}, {
			label: 'Geomagnetic field strength in Z',
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
      text: 'Geomagnetic field strength around the device'
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
					labelString: 'μT'
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
var magnetometerDateArray = [];
var magnetometerSensorData = [];
var magnetometerInsertedRows = 0;

function addMagnetometerValue(chart, item) {
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

function cleanMagnetometerChart(chart) {
	chart.data.labels = [];
	chart.data.datasets[0].data = [];
	chart.data.datasets[1].data = [];
	chart.data.datasets[2].data = [];
}

function getMagnetometerData() {
	var content = [];

	for (var i = 0; i < magnetometerSensorData.length; ++i) {
		var value = magnetometerSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.x, value.y, value.z]);
	}

	return content;
}

function removeMagnetometerListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showMagnetometerCharts(userID, sensorName, databaseRef) {
  // Reset
	magnetometerDateArray = [];
  magnetometerSensorData = [];
  magnetometerInsertedRows = 0;

  var chartIDArray = ['magnetometer-axes'];
  var chartTitleArray = ['Magnetometer'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, magnetometerConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++magnetometerInsertedRows;

					magnetometerSensorData.push(snapshot);
					updateMagnetometerChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showMagnetometerData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanMagnetometerChart(chart);

        snapshot.forEach((item, i) => {
          magnetometerDateArray.push(addMagnetometerValue(chart, item));
          magnetometerSensorData.push(item);
        });

        if (magnetometerDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(magnetometerDateArray[0], magnetometerDateArray[magnetometerDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'x', 'y', 'z']);
        if (!showMagnetometerData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateMagnetometerChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 400);
  });
}

function showMagnetometerData(minDataIndex, numRows, isNew) {
  if (magnetometerSensorData.length > 0) {
    var index = magnetometerSensorData.length - 1 - minDataIndex - (isNew ? 0: magnetometerInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, magnetometerSensorData[index].val().date, magnetometerSensorData[index].val().x.toFixed(4), magnetometerSensorData[index].val().y.toFixed(4), magnetometerSensorData[index].val().z.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateMagnetometerChart(chart, from, to) {
  var length = magnetometerSensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentMagnetometerDateArray = [];
	cleanMagnetometerChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentMagnetometerDateArray.push(addMagnetometerValue(chart, magnetometerSensorData[i]));
  }

  if (currentMagnetometerDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentMagnetometerDateArray[0], currentMagnetometerDateArray[currentMagnetometerDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
