var activities = [ "Vehicle", "Bicycle", "On foot", "Running", "Still", "Walking", "Tilting", "Unknown" ];
var color = Chart.helpers.color;
var activityRecognitionConfig = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			label: 'Vehicle',
			backgroundColor: color(window.chartColors.purple).rgbString(),
			borderColor: window.chartColors.purple,
			fill: false,
			data: []
		},
		{
			label: 'Bicyle',
			backgroundColor: color(window.chartColors.appPurple).rgbString(),
			borderColor: window.chartColors.appPurple,
			fill: false,
			data: []
		},
		{
			label: 'On foot',
			backgroundColor: color(window.chartColors.yellow).rgbString(),
			borderColor: window.chartColors.yellow,
			fill: false,
			data: []
		},
		{
			label: 'Running',
			backgroundColor: color(window.chartColors.green).rgbString(),
			borderColor: window.chartColors.green,
			fill: false,
			data: []
		},
		{
			label: 'Still',
			backgroundColor: color(window.chartColors.blue).rgbString(),
			borderColor: window.chartColors.blue,
			fill: false,
			data: []
		},
		{
			label: 'Walking',
			backgroundColor: color(window.chartColors.orange).rgbString(),
			borderColor: window.chartColors.orange,
			fill: false,
			data: []
		},
		{
			label: 'Tilting',
			backgroundColor: color(window.chartColors.red).rgbString(),
			borderColor: window.chartColors.red,
			fill: false,
			data: []
		},
		{
			label: 'Unknown',
			backgroundColor: color(window.chartColors.grey).rgbString(),
			borderColor: window.chartColors.grey,
			fill: false,
			data: []
		}]
	},
	options: {
    title: {
      display: true,
      text: 'Activities detected'
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
					labelString: 'Number of events'
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

var activityLastHoursConfig = {
	type: 'doughnut',
	data: {
		datasets: [{
			data: [],
			backgroundColor: [
				window.chartColors.purple,
				window.chartColors.appPurple,
				window.chartColors.yellow,
				window.chartColors.green,
				window.chartColors.blue,
				window.chartColors.orange,
				window.chartColors.red,
				window.chartColors.grey,
			],
			label: 'Dataset 1'
		}],
		labels: activities
	},
	options: {
    title: {
      display: true,
      text: 'Activities detected'
    },
    animation: {
			animateScale: true,
			animateRotate: true
    },
		responsive: true,
	 	maintainAspectRatio: false
	}
};

// Sensor date
var activityRecognitionDateArray = [];
var activityRecognitionSensorData = [];
var activityRecognitionInsertedRows = 0;
var timeGranularityArray = ['Hour', 'Day', 'Month', 'Year'];

function addActivityRecognitionValue(chart, date, activityRecountValue) {
  chart.data.labels.push(date);

	for (var activity = 0; activity < activities.length; ++activity) {
		  chart.data.datasets[activity].data.push(activityRecountValue[activities[activity]]);
	}

  return date;
}

function addActivityLastHoursValue(chart, activityRecountValue) {
	for (var activity = 0; activity < activities.length; ++activity) {
		  chart.data.datasets[0].data.push(activityRecountValue[activities[activity]]);
	}
}

function getActivityRecognitionData() {
	var content = [];

	for (var i = 0; i < activityRecognitionSensorData.length; ++i) {
		var value = activityRecognitionSensorData[i].val();

		content.push([getMomentDate(value.date).format('DD/MM/YYYY HH:mm:ss:SS'), value.activity, value.confidence]);
	}

	return content;
}

function removeActivityRecogListeners(databaseRef) {
	if (databaseRef == null) return;

	databaseRef.off('child_added');
}

function showActivityRecognitionCharts(userID, sensorName, databaseRef) {
  // Reset
	activityRecognitionDateArray = [];
  activityRecognitionSensorData = [];
  sensorArray = [];
  activityRecognitionInsertedRows = 0;

  var chartIDArray = ['activity-recognition-data', 'activity-recognition-24-hours-data'];
  var chartTitleArray = ['Activity recognition', 'Last 24 hours'];

  loadChartsRows(2, chartIDArray, chartTitleArray).done(function() {
    setTimeout(function() {
			var newItems = false;

      var ctx1 = $('#' + chartIDArray[0]).find('canvas')[0].getContext('2d');
      var historyChart = new Chart(ctx1, activityRecognitionConfig);

			var ctx2 = $('#' + chartIDArray[1]).find('canvas')[0].getContext('2d')
			var lastHoursChart = new Chart(ctx2, activityLastHoursConfig);

			databaseRef.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
				if (newItems) {
					var index = 0;
					var value = $('#' + chartIDArray[0]).find(".js-range-slider").prop("value");
					++activityRecognitionInsertedRows;

					for (var i = 1; i < timeGranularityArray.length; ++i) {
						if (value == timeGranularityArray[i]) {
							index = i;
							break;
						}
					}

					activityRecognitionSensorData.push(snapshot);
					activityRecognitionDateArray.push(getMomentDate(snapshot.val().date));
					updateActivityRecognitionChart(historyChart, index);
					updateLastActivitiesChart(lastHoursChart);
					showActivityRecognitionData(0, 1, true);
				}
			});

      databaseRef.once('value', function(snapshot) {
        snapshot.forEach((item, i) => {
					activityRecognitionDateArray.push(getMomentDate(item.val().date));
          activityRecognitionSensorData.push(item);
        });

				// Initialize chart
				updateActivityRecognitionChart(historyChart, 0);
				updateLastActivitiesChart(lastHoursChart);

        addSensorTableHeader(['#', 'Timestamp', 'Activity', 'Confidence']);
        if (!showActivityRecognitionData(0, rowsPerLoad, false)) {
          $('#display-more-rows').show();
        }

        // Listen for slider events
        $('#' + chartIDArray[0]).find(".js-range-slider").ionRangeSlider({
					type: 'single',
					values: timeGranularityArray,
          onFinish: function (data) {
            updateActivityRecognitionChart(historyChart, data.from);
          }
        });

				// Hide second slider (fixed time, 24 hours)
				$('#' + chartIDArray[1]).find(".js-range-slider").hide();

				newItems = true;
      });

    }, 400);
  });
}

function showActivityRecognitionData(minDataIndex, numRows, isNew) {
  if (activityRecognitionSensorData.length > 0) {
    var index = activityRecognitionSensorData.length - 1 - minDataIndex - (isNew ? 0: activityRecognitionInsertedRows);
    var endIndex = index - numRows + 1;

    while (index >= 0 && index >= endIndex) {
      addSensorRow([index, activityRecognitionSensorData[index].val().date, activityRecognitionSensorData[index].val().activity, activityRecognitionSensorData[index].val().confidence], isNew);
      --index;
    }

    return index < 0;
  }
}

function updateActivityRecognitionChart(historyChart, from) {
	var dateFormat = ["YYYY/MM/DD hh a", "YYYY/MM/DD", "YYYY/MM", "YYYY"];
	var timeGranularity = [['hour', 4], ['day', 1], ['month', 1], ['year', 1]];
	var dateMap = { };

	for (var i = 0; i < activityRecognitionDateArray.length; ++i) {
		var dateFormatted = activityRecognitionDateArray[i].format(dateFormat[from]);

		if (!(dateFormatted in dateMap)) {
			dateMap[dateFormatted] = {};

			activities.forEach((item, i) => {
				dateMap[dateFormatted][item] = .0;
			});

		}

		dateMap[dateFormatted][activityRecognitionSensorData[i].val().activity] += 1;
	}

	// Clean dataset and labels
	historyChart.data.labels = [];
	for (var dataset = 0; dataset < activities.length; ++dataset) {
		historyChart.data.datasets[dataset].data = [];
	}

	for (const [key, activityRecountMap] of Object.entries(dateMap)) {
		var date = moment(key, dateFormat[from]);
		addActivityRecognitionValue(historyChart, date, activityRecountMap);
	}

  historyChart.options.scales.xAxes[0].time.round = timeGranularity[from][0];
  historyChart.options.scales.xAxes[0].time.unit = timeGranularity[from][0];
  historyChart.options.scales.xAxes[0].time.unitStepSize = timeGranularity[from][1];
	historyChart.options.scales.xAxes[0].time.tooltipFormat = dateFormat[from];
  historyChart.update();
}

function updateLastActivitiesChart(lastHoursChart) {
	var activityMap = { };
	var currentDate = moment();

	activities.forEach((item, i) => {
		activityMap[item] = .0;
	});

	for (var i = 0; i < activityRecognitionDateArray.length; ++i) {
		var diff = currentDate.diff(activityRecognitionDateArray[i], 'hours');

		if (diff <= 24) {
			activityMap[activityRecognitionSensorData[i].val().activity] += 1;
		}
	}

	// Clean dataset and labels
	lastHoursChart.data.datasets[0].data = [];

	addActivityLastHoursValue(lastHoursChart, activityMap);

	lastHoursChart.update();
}
