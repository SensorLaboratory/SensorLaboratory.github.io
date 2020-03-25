$(document).ready(function() {
  /*------------------------- FIREBASE -----------------------------*/
  // Initialize Firebase
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyCLo7CisdsJVBsD8b4fp4Vq7gZmcoWN-Ag",
    authDomain: "sensornetwork-20970.firebaseapp.com",
    databaseURL: "https://sensornetwork-20970.firebaseio.com",
    projectId: "sensornetwork-20970",
    storageBucket: "sensornetwork-20970.appspot.com",
    messagingSenderId: "102277193455",
    appId: "1:102277193455:web:7deeb4b06e943e29fe851a",
    measurementId: "G-NB4Z5RVBYN"
  };
  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var database = firebase.database();             // Reference to the database service
  var projectsRef = database.ref('projects');
  var adminsRef = database.ref('admins');         // Users who are an administrator
  var userID = "";

  // Changes on the session (log in, log out...)
  auth.onAuthStateChanged(function(user) {
    if (user) {
      setUserData(user);
      initializeReferences();

      // First plot
      $('#accelerometer-card').trigger('click');
    } else {
      console.log('Hola');
      //document.location.href = 'login.html';      // Go back
    }
  });

  // Log out
  $('#sign-out').on('click', function() {
    auth.signOut();
    $('#welcome').hide();
    $('#authentication').show();
  });

  /*------------------- SENSOR & PLUGINS ---------------*/
  const Sensors = {
      ACCELEROMETER: 'Accelerometer',
      BAROMETER: 'Barometer',
      GRAVITY: 'Gravity',
      GYROSCOPE: 'Gyroscope',
      LIGHT: 'Light',
      LOCATION: 'Location',
      MAGNETOMETER: 'Magnetometer',
      PROXIMITY: 'Proximity'
  }

  const Plugins = {
      ACTIVITY_RECOGNITION: 'ActivityRecognition',
      AMBIENT_NOISE: 'AmbientNoise'
  }

  var isSensor = true;
  var currentSensor = Sensors.ACCELEROMETER;
  var currentPlugin = Plugins.ACTIVITY_RECOGNITION;
  var displayMoreRows = true;
  var minDataIndex = 0;

  // Database
  var accelerometerRef, barometerRef, gravityRef, gyroscopeRef, lightRef, locationRef, magnetometerRef, proximityRef;
  var activityRecognitionRef, ambientNoiseRef;

  // Resources
  var sensorDescription = [8]
  sensorDescription[Sensors.ACCELEROMETER] = '"...The accelerometer measures the acceleration applied to the sensor built-in into the device, including the force of gravity. In other words, the force of gravity is always influencing the measured acceleration, thus when the device is sitting on a table, the accelerometer reads the acceleration of gravity: 9.81 m/s². Similarly, if the phone is in free-fall towards the ground, the accelerometer reads: 0 m/s²..."';
  sensorDescription[Sensors.BAROMETER] = '"...The barometer sensor measures the ambient air pressure. Barometer can be leveraged to detect and predict short team changes in weather, for example drops in pressure indicate rain, while raises indicate good weather ahead..."';
  sensorDescription[Sensors.GRAVITY] = '"...The gravity sensor measures the force of gravity applied to the sensor built-in into the device and provides a three dimensional vector indicating the direction and magnitude of gravity (in m/s²). When a device is at rest, the gravity sensor should measure equally as the accelerometer..."';
  sensorDescription[Sensors.GYROSCOPE] = '"...The gyroscope sensor measures the rate or rotation in rad/s around a device’s x, y and z axis. Rotation is positive in the counter-clockwise direction; that is, an observer looking from some positive location on the x, y or z axis at a device positioned on the origin would report positive rotation if the device appeared to be rotating counter clockwise. This is the standard mathematical definition of positive rotation and is not the same as the definition for roll that is used by the orientation sensor.';
  sensorDescription[Sensors.LIGHT] = '"...The light sensor measures the ambient light. It can be used to detect indoor or outdoor light conditions. The official SensorManager Light constants are: \n\n' +
  'Cloudy sky: 100.0\nFull moon: 0.25\nNo moon: 0.001\nOvercast: 10000.0\nShade: 20000.0\nSunlight: 110000.0\nSunlight maximum: 120000.0\nSunrise: 400.0\n\n..."';
  sensorDescription[Sensors.LOCATION] = '"...The locations sensor provides the best location estimate for the users’ current location, automatically. We have built-in an algorithm that provides the user’s location with a minimum battery impact..."';
  sensorDescription[Sensors.MAGNETOMETER] = '"...The magnetometer measures the geomagnetic field strength around the device. It lets you monitor changes in the Earth’s magnetic field. This sensor provides raw field strength data (in μT) for each of the axis..."';
  sensorDescription[Sensors.PROXIMITY] = '"...The proximity sensor measures the distance to an object in front of the mobile device. Depending on the hardware, it can be in centimeters or binary..."';

  var pluginDescription = [2];
  pluginDescription[Plugins.ACTIVITY_RECOGNITION] = '"...Plugin that uses Google Location APIs to capture users mode of transportation: still, walking, running, biking, in vehicle (car, bus)..."';
  pluginDescription[Plugins.AMBIENT_NOISE] = '"...This plugin measures the ambient noise (Hz, dB), and classifies the sample as noisy or silent moments (>50dB for noisy environments)..."';

  var sensorImage = [8];
  sensorImage[Sensors.ACCELEROMETER] = 'assets/images/visualize/cards/AccelerometerOpacity.png';
  sensorImage[Sensors.BAROMETER] = 'assets/images/visualize/cards/BarometerOpacity.png';
  sensorImage[Sensors.GRAVITY] = 'assets/images/visualize/cards/GravityOpacity.png';
  sensorImage[Sensors.GYROSCOPE] = 'assets/images/visualize/cards/GyroscopeOpacity.png';
  sensorImage[Sensors.LIGHT] = 'assets/images/visualize/cards/LightOpacity.png';
  sensorImage[Sensors.LOCATION] = 'assets/images/visualize/cards/LocationOpacity.png';
  sensorImage[Sensors.MAGNETOMETER] = 'assets/images/visualize/cards/MagnetometerOpacity.png';
  sensorImage[Sensors.PROXIMITY] = 'assets/images/visualize/cards/ProximityOpacity.png';

  var pluginImage = [2];
  pluginImage[Plugins.ACTIVITY_RECOGNITION] = 'assets/images/visualize/cards/ActivityRecognitionOpacity.png';
  pluginImage[Plugins.AMBIENT_NOISE] = 'assets/images/visualize/cards/AmbientNoiseOpacity.png';

  updateCards(true);    // First call

  function initializeReferences() {
      accelerometerRef = firebase.database().ref(userID + '/' + Sensors.ACCELEROMETER + '/');
      barometerRef = firebase.database().ref(userID + '/' + Sensors.BAROMETER + '/');
      gravityRef = firebase.database().ref(userID + '/' + Sensors.GRAVITY + '/');
      gyroscopeRef = firebase.database().ref(userID + '/' + Sensors.GYROSCOPE + '/');
      lightRef = firebase.database().ref(userID + '/' + Sensors.LIGHT + '/');
      locationRef = firebase.database().ref(userID + '/' + Sensors.LOCATION + '/');
      magnetometerRef = firebase.database().ref(userID + '/' + Sensors.MAGNETOMETER + '/');
      proximityRef = firebase.database().ref(userID + '/' + Sensors.PROXIMITY + '/');

      activityRecognitionRef = firebase.database().ref(userID + '/' + Plugins.ACTIVITY_RECOGNITION + '/');
      ambientNoiseRef = firebase.database().ref(userID + '/' + Plugins.AMBIENT_NOISE + '/');
  }

  $('#generate-report').on('click', function() {
    saveCSV(isSensor ? currentSensor : currentPlugin, getCSVContent());
  });

  $('#sensor-selector').on('click', function() {
    updateCards(true);

    $('#accelerometer-card').trigger('click');
  });

  $('#plugin-selector').on('click', function() {
    updateCards(false);

    $('#activity-recognition-card').trigger('click');
  });

  $('#accelerometer-card').on('click', function() {
    removeListeners();
    resetPage();
    currentSensor = Sensors.ACCELEROMETER;

    isSensor = true;
    showAccelerometerCharts(userID, currentSensor, accelerometerRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#activity-recognition-card').on('click', function() {
    removeListeners();
    resetPage();
    currentPlugin = Plugins.ACTIVITY_RECOGNITION;

    isSensor = false;
    showActivityRecognitionCharts(userID, currentPlugin, activityRecognitionRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#ambient-noise-card').on('click', function() {
    removeListeners();
    resetPage();
    currentPlugin = Plugins.AMBIENT_NOISE;

    isSensor = false;
    showAmbientNoiseCharts(userID, currentPlugin, ambientNoiseRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#barometer-card').on('click', function() {
    removeListeners();
    resetPage();
    currentSensor = Sensors.BAROMETER;

    isSensor = true;
    showBarometerCharts(userID, currentSensor, barometerRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#gravity-card').on('click', function() {
    removeListeners();
    resetPage();
    currentSensor = Sensors.GRAVITY;

    isSensor = true;
    showGravityCharts(userID, currentSensor, gravityRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#gyroscope-card').on('click', function() {
    removeListeners();
    resetPage();

    isSensor = true;
    currentSensor = Sensors.GYROSCOPE;
    showGyroscopeCharts(userID, currentSensor, gyroscopeRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#light-card').on('click', function() {
    removeListeners();
    resetPage();

    isSensor = true;
    currentSensor = Sensors.LIGHT;
    showLightCharts(userID, currentSensor, lightRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#location-card').on('click', function() {
    removeListeners();
    resetPage();

    isSensor = true;
    currentSensor = Sensors.LOCATION;
    showLocationCharts(userID, currentSensor, locationRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#magnetometer-card').on('click', function() {
    removeListeners();
    resetPage();

    isSensor = true;
    currentSensor = Sensors.MAGNETOMETER;
    showMagnetometerCharts(userID, currentSensor, magnetometerRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  })

  $('#proximity-card').on('click', function() {
    removeListeners();
    resetPage();

    isSensor = true;
    currentSensor = Sensors.PROXIMITY;
    showProximityCharts(userID, currentSensor, proximityRef);
    updateDescriptionCard(true);
    activeSensorCard($(this));
  });


  function getCSVContent() {
    if (isSensor) {
      switch (currentSensor) {
        case Sensors.ACCELEROMETER:
          return getAccelerometerData();
        case Sensors.BAROMETER:
          return getBarometerData();
        case Sensors.GRAVITY:
          return getGravityData();
        case Sensors.GYROSCOPE:
          return getGyroscopeData();
        case Sensors.LIGHT:
          return getLightData();
        case Sensors.LOCATION:
          return getLocationData();
        case Sensors.MAGNETOMETER:
          return getMagnetometerData();
        case Sensors.PROXIMITY:
          return getProximityData();
      }
    } else {
      switch (currentPlugin) {
        case Plugins.ACTIVITY_RECOGNITION:
          return getActivityRecognitionData();
        case Plugins.AMBIENT_NOISE:
          return getAmbientNoiseData();
      }
    }
  }

  function resetPage() {
    minDataIndex = rowsPerLoad;

    $('#display-more-rows').hide();
    $('#chart-container').empty();
    $('#sensor-data-list').empty();
    $('#timestamp-input').val('');
  }

  function updateCards(pickedSensors) {
    pickedSensors ? $('.sensor-row').show() : $('.sensor-row').hide();
    !pickedSensors ? $('.plugin-row').show() : $('.plugin-row').hide();
  }

  function updateDescriptionCard(pickedSensor) {
    if (isSensor) {
      $('#description-title').text(currentSensor);
      $('#description-content').text(sensorDescription[currentSensor]);
      $('#description-card').css('background-image', 'url(' + sensorImage[currentSensor] + ')');
    }
    else {
      $('#description-title').text(currentPlugin.replace(/([A-Z])/g, " $1").trim());
      $('#description-content').text(pluginDescription[currentPlugin]);
      $('#description-card').css('background-image', 'url(' + pluginImage[currentPlugin] + ')');
    }
  }

  function setUserData(user) {
    userID = user.uid;
    $('#profileImage').attr('src', 'http://www.gravatar.com/avatar/' + md5(user.email) + '?d=identicon&s=200');
    $('#username').text(user.displayName);
  }

  function activeSensorCard(sensorCard) {
    $(".card.active").toggleClass("active");
    sensorCard.find(".card").toggleClass("active");
  }

  /*-------------------- CHARTS AND TABLES ---------------------*/

  $('#display-more-rows').on('click', function() {
    if (isSensor) {
      switch (currentSensor) {
        case Sensors.ACCELEROMETER:
          if (showAccelerometerData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.BAROMETER:
          if (showBarometerData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.GRAVITY:
          if (showGravityData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.GYROSCOPE:
          if (showGyroscopeData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.LIGHT:
          if (showLightData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.LOCATION:
          if (showLocationData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.MAGNETOMETER:
          if (showMagnetometerData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Sensors.PROXIMITY:
          if (showProximityData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        default:

      }
    } else {
      switch (currentPlugin) {
        case Plugins.ACTIVITY_RECOGNITION:
          if (showActivityRecognitionData(minDataIndex, rowsPerLoad, false)) {
            $('#display-more-rows').hide();
          }
          else {
            minDataIndex += rowsPerLoad;
          }

          break;
        case Plugins.AMBIENT_NOISE:
            if (showAmbientNoiseData(minDataIndex, rowsPerLoad, false)) {
              $('#display-more-rows').hide();
            }
            else {
              minDataIndex += rowsPerLoad;
            }

            break;
      }
    }
  });

  $('#timestamp-input').on('input', function() {
    if (!$(this).val()) {
        if (displayMoreRows) {
          $('#display-more-rows').show();
        }
    } else {
        if (!displayMoreRows) {
          displayMoreRows = $('#display-more-rows').is(':visible');
        }
        $('#display-more-rows').hide();
    }

    $('#sensor-data-list').find('tr').find('td:nth-child(2)').each(function(){
        if(!$(this)[0].innerText.includes($('#timestamp-input').val())) {
          $(this).parent().hide();
        }
        else {
          $(this).parent().show();
        }
    });
  });

  function removeListeners() {
    if (isSensor) {
      switch (currentSensor) {
        case Sensors.ACCELEROMETER:
          removeAccelerometerListeners(accelerometerRef);

          break;
        case Sensors.BAROMETER:
          removeBarometerListeners(barometerRef);

          break;
        case Sensors.GRAVITY:
          removeGravityListeners(gravityRef);

          break;
        case Sensors.GYROSCOPE:
          removeGravityListeners(gyroscopeRef);

          break;
        case Sensors.LIGHT:
          removeLightListeners(lightRef);

          break;
        case Sensors.LOCATION:
          removeLocationListeners(locationRef);

          break;
        case Sensors.MAGNETOMETER:
          removeMagnetometerListeners(magnetometerRef);

          break;
        case Sensors.PROXIMITY:
          removeProximityListeners(proximityRef);

          break;
        }
    }
    else {
      switch (currentSensor) {
        case Sensors.ACTIVITY_RECOGNITION:
          removeActivityRecognitionListeners(activityRecognitionRef);

          break;

        case Sensors.AMBIENT_NOISE:
          removeAmbientNoiseListeners(ambientNoiseRef);

          break;
        }
    }
  }
});
