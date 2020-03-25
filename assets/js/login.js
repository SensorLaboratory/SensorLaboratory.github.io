$(document).ready(function() {
  // Navbar variables
  var NAVBAR_HEIGHT = 60;                     // Height when the navbar changes its style

  // Change the background as the page is scrolled
  $(window).scroll(function() {
  });

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

  // Log in
  $('#sign-in-button').on('click', function() {
    signInCall();
  });

  // Log out
  $('#sign-out').on('click', function() {
    auth.signOut();
    $('#welcome').hide();
    $('#authentication').show();
  });

  // Transition to data charts
  $('.visualize-data-button').on('click', function() {
    document.location.href = "visualize_data.html";
  });

  // Changes on the session (log in, log out...)
  auth.onAuthStateChanged(function(user) {
    if (user) {
      $('#authentication').hide();
      prepareNewBlock(user);
    } else {
      $('#welcome').hide();
      $('#authentication').show();
    }
  });

  // Prepare the page as a new admin has logged in successfully
  function prepareNewBlock(user) {
    // Prepare the new block
    $('#welcome').find('h2').text('Welcome, ' + user.displayName + '!');
    $('#welcome').show();
  }

  // Show the 'Sign in' window
  function signInCall() {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function(result) {
      var email = result.user.email;
    }).catch(function(error) {
      showError(error);
    });
  }
});
