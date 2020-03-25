$(document).ready(function() {
  $(window).resize(function() {
    checkScrollTopAppearance();
  });

  $(window).scroll(function() {
    checkScrollTopAppearance();
  });

  // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
  $('body.fixed-nav .sidebar').on('mousewheel DOMMouseScroll wheel', function(e) {
    if ($(window).width() > 768) {
      var e0 = e.originalEvent,
        delta = e0.wheelDelta || -e0.detail;
      this.scrollTop += (delta < 0 ? 1 : -1) * 30;
      e.preventDefault();
    }
  });

  // Toggle the side navigation
  $("#sidebarToggle, #sidebarToggleTop").on('click', function(e) {
    $("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");
    if ($(".sidebar").hasClass("toggled")) {
      $('.sidebar .collapse').collapse('hide');
    };
  });

  ////// 'PRIVATE' METHODS

  /*
    Checks the state of the 'Scroll to Top' button in order to show/hide it.
  */
  function checkScrollTopAppearance() {
    var minimumHeight = 50;
    var scrollTopButton = $('.scroll-top-button');

    if ($(window).scrollTop() > minimumHeight) {
      scrollTopButton.show(400);
    } else {
      scrollTopButton.hide(400);
    }
  }

  /*
    Checks if an element is visible in the viewport. That element must be
    provided as an object.
  */
  function isObjectVisible(object) {
    var elementTop = $(object).offset().top;
    var elementBottom = elementTop + $(object).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
  }

  /*
    Checks if an element is visible in the viewport. That element must be
    provided by means of an string in order to use a selector.
  */
  function isVisible(objectName) {
    if ($(objectName).length) {
      var elementTop = $(objectName).offset().top;
      var elementBottom = elementTop + $(objectName).outerHeight();

      var viewportTop = $(window).scrollTop();
      var viewportBottom = viewportTop + $(window).height();

      return elementBottom > viewportTop && elementTop < viewportBottom;
    } else {
      return false;
    }
  }
});


/*--------------------- FUNCTIONS TO BE ACCESSED OUTSIDE THIS JS FILE ------------------------*/

// Creates a popup with the specified class and message
function getPopUp(myClass, msg) {
  return $('<div class="alert alert-success alert-dismissible fade show ' + myClass +'" role="alert">' +
              msg +
              '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
              '</button>' +
            '</div>');
}

// Remove all those elements that belongs to the class *-pop-up
function removePopUpMessages() {
  $('.error-pop-up').remove();
  $('.success-pop-up').remove();
}

// Show a popup with a success message (green pop up)
function showSuccessMessage(message) {
  var div = getPopUp('success-pop-up', message);
  showNewPopUp(div);
}

// Shows a collapsible message with an error message (red pop up)
function showError(error) {
  var div = getPopUp('error-pop-up', error);
  showNewPopUp(div);
}

// Generic function to show a new pop up
function showNewPopUp(popup) {
  removePopUpMessages();        // Delete all those that already exist
  $('body').append(popup).show('slow');

  // Delete the pop up after some time
  setTimeout(function() {
    popup.hide('2000').remove();
  }, 8000);
}
