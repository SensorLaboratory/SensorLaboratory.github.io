var color = Chart.helpers.color;
var lightConfig = {
	type: 'line',
	data: {
    labels: [],
		datasets: [{
			label: 'Ambient light',
			backgroundColor: color(window.chartColors.appRed).alpha(0.5).rgbString(),
      borderColor: window.chartColors.appRed,
			fill: true,
			data: [],
      tension: 0
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Ambient luminance in lux units'
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
					labelString: 'Lux'
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
var lightDateArray = [];
var lightSensorData = [];
var lightInsertedRows = 0;

function addLightValue(chart, item) {
  var lux = item.val().lux;
  var date = getMomentDate(item.val().date);

  chart.data.labels.push(date);
  chart.data.datasets[0].data.push(lux);

  return date;
}

function cleanLightChart(chart) {
	chart.data.labels = [];
  chart.data.datasets[0].data = [];
}

function getLightData() {
	var content = [];

	for (var i = 0; i < lightSensorData.length; ++i) {
		var value = lightSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.lux]);
	}

	return content;
}

function removeLightListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showLightCharts(userID, sensorName, databaseRef) {
  // Reset
	lightDateArray = [];
  lightSensorData = [];
  lightInsertedRows = 0;

  var chartIDArray = ['ambient-light'];
  var chartTitleArray = ['Ambient luminance'];

  loadChartsRows(1, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
      var ctx = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var chart = new Chart(ctx, lightConfig);
			var newItems = false;

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var fromTo = $(".js-range-slider").prop("value").split(';');
					++lightInsertedRows;

					lightSensorData.push(snapshot);
					updateLightChart(chart, parseFloat(fromTo[0]), parseFloat(fromTo[1]));
					showLightData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
				cleanLightChart(chart);

        snapshot.forEach((item, i) => {
          lightDateArray.push(addLightValue(chart, item));
          lightSensorData.push(item);
        });

        if (lightDateArray.length >= 2) {
          var timeGranularity = getTimeGranularity(lightDateArray[0], lightDateArray[lightDateArray.length - 1]);
          chart.options.scales.xAxes[0].time.round = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
          chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
        }

        chart.update();
        addSensorTableHeader(['#', 'Timestamp', 'Lux']);
        if (!showLightData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $(".js-range-slider").ionRangeSlider({
					min: 0, max: 100, from: 0, to: 100, type: 'double',
          onFinish: function (data) {
            updateLightChart(chart, data.from, data.to);
          }
        });

				newItems = true;
      });

    }, 500);
  });
}

function showLightData(minDataIndex, numRows, isNew) {
  if (lightSensorData.length > 0) {
    var index = lightSensorData.length - 1 - minDataIndex - (isNew ? 0: lightInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, lightSensorData[index].val().date, lightSensorData[index].val().lux.toFixed(4)], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateLightChart(chart, from, to) {
  var length = lightSensorData.length;
  var orig = Math.floor(from * length / 100.0);
  var dest = Math.ceil(to * length / 100.0);

  // Clean dataset and labels
  var currentLightDateArray = [];
	cleanLightChart(chart);

  for (var i = orig; i < dest; ++i) {
    currentLightDateArray.push(addLightValue(chart, lightSensorData[i]));
  }

  if (currentLightDateArray.length >= 2) {
    var timeGranularity = getTimeGranularity(currentLightDateArray[0], currentLightDateArray[currentLightDateArray.length - 1]);
    chart.options.scales.xAxes[0].time.round = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unit = timeGranularity[0];
    chart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[1];
  }

  chart.update();
}
