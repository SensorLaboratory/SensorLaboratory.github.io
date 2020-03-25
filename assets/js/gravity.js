var color = Chart.helpers.color;
var gravityConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Force of gravity in X',
			backgroundColor: color(window.chartColors.red).rgbString(),
      borderColor: window.chartColors.red,
			fill: false,
			tension: 0.2,
			data: [],
		}, {
			label: 'Force of gravity in Y',
			backgroundColor: color(window.chartColors.blue).rgbString(),
			borderColor: window.chartColors.blue,
			fill: false,
			tension: 0.2,
		  data: [],
		}, {
			label: 'Force of gravity in Z',
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
      text: 'Force of gravity in X, Y, Z'
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
var gravityDateArray = [];
var gravitySensorData = [];
var gravityInsertedRows = 0;

function addGravityValue(chart, item) {
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

function cleanGravityChart(chart) {
	chart.data.labels = [];
	chart.data.datasets[0].data = [];
	chart.data.datasets[1].data = [];
	chart.data.datasets[2].data = [];
}

function getGravityData() {
	var content = [];

	for (var i = 0; i < gravitySensorData.length; ++i) {
		var value = gravitySensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.x, value.y, value.z]);
	}

	return content;
}

function removeGravityListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showGravityCharts(userID, sensorName, databaseRef) {
  // Reset
	gravityDateArray = [];
  gravitySensorData = [];
  gravityInsertedRows = 0;

  var chartIDArray = ['gravity-force'];
  var chartTitleArray = ['Force of gravity'];

  loadChartsRows(1, chartIDArray, ["Gravity axes"]).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, gravityConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++gravityInsertedRows;

					gravitySensorData.push(snapshot);
					updateGravityChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showGravityData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanGravityChart(chart);

        snapshot.forEach((item, i) => {
          gravityDateArray.push(addGravityValue(chart, item));
          gravitySensorData.push(item);
        });

        if (gravityDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(gravityDateArray[0], gravityDateArray[gravityDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'x', 'y', 'z']);
        if (!showGravityData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateGravityChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 200);
  });
}

function showGravityData(minDataIndex, numRows, isNew) {
  if (gravitySensorData.length > 0) {
    var index = gravitySensorData.length - 1 - minDataIndex - (isNew ? 0: gravityInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, gravitySensorData[index].val().date, gravitySensorData[index].val().x.toFixed(4), gravitySensorData[index].val().y.toFixed(4), gravitySensorData[index].val().z.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateGravityChart(chart, from, to) {
  var length = gravitySensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentGravityDateArray = [];
	cleanGravityChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentGravityDateArray.push(addGravityValue(chart, gravitySensorData[i]));
  }

  if (currentGravityDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentGravityDateArray[0], currentGravityDateArray[currentGravityDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
