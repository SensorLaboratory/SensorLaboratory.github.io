var timeFormat = 'MM/DD/YYYY HH:mm';
var rowsPerLoad = 30;

window.chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)',
	appRed: 'rgb(242, 56, 96)',
	appPurple: 'rgb(39, 54, 77)'
};

function getTimeGranularity(date1, date2) {
  if (date2.diff(date1, 'year') > .0) {
    return ['year', 1];
  }

  if (date2.diff(date1, 'months') > .0) {
    return ['month', 1];
  }

  if (date2.diff(date1, 'weeks') > .0) {
    return ['week', 1];
  }

  if (date2.diff(date1, 'days') > .0) {
    return ['day', 1];
  }

  if (date2.diff(date1, 'hours') > .0) {
    return ['hour', 1];
  }

  if (date2.diff(date1, 'minutes') > .0) {
    return ['minute', 1];
  }

  return ['second', 3];
}

function addSensorTableHeader(values) {
	var row = '<tr>';

	values.forEach((item, i) => {
		row += '<th scope="col">' + item + '</th>';
	});

	row += '</tr>';

	$('#sensor-data-list').append(row);
}

function addSensorRow(values, belowHeader) {
	var row = '<tr>';

	values.forEach((item, i) => {
		row += '<td scope="col">' + item + '</td>';
	});

	row += '</tr>';

	if (belowHeader) {
		$('#sensor-data-list').find('tr:first').after(row);
	}
	else {
		$('#sensor-data-list').append(row);
	}
}

function loadChartsRows(numCharts, idArray, titles) {
  for (var i = 0; i < numCharts; ++i)
  {
    $('#chart-container').append('<div id="' + idArray[i] + '" class="chart-card" chart-name="' + titles[i] + '"></div>');
  }

  $('.chart-card').each(function() {
    var newChart = $(this).load('templates/chart-card.html', function() {
      $(this).find('.chart-title').text($(this).attr('chart-name'));
    });
  });

  return $.Deferred().resolve(false);
}

function getDate(dateStr) {
  var dayHour = dateStr.split(' ');
  var yearMonthDay = dayHour[0].split('-');
  var hourMinuteSecondMillis = dayHour[1].split(':');

  return new Date(parseInt(yearMonthDay[0]), parseInt(yearMonthDay[1]) - 1, parseInt(yearMonthDay[2]),
                  parseInt(hourMinuteSecondMillis[0]), parseInt(hourMinuteSecondMillis[1]), parseInt(hourMinuteSecondMillis[2]), parseInt(hourMinuteSecondMillis[3]));
}

function getMomentDate(dateStr) {
	var dayHour = dateStr.split(' ');
	var yearMonthDay = dayHour[0].split('-');
	var hourMinuteSecondMillis = dayHour[1].split(':');

	return new moment(dateStr, "YYYY-MM-DD hh:mm:ss:SSS");
}
