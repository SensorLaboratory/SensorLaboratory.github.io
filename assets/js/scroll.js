
$(document).on('click', 'a', function(event) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({scrollTop: target.offset().top}, 1000, function() {
          // Callback after animation
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) { // Checking if the target was focused
            return false;
          } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
          };
        });
      }
    }
  });

  $(document).on('click', '.sensor-card > .card', function(event) {
    if (window.innerWidth < 1200) {
      // Only prevent default if animation is actually gonna happen
      event.preventDefault();
      $('html, body').delay(1000).animate({scrollTop: $("#chart-container").offset().top}, 1000, function() {
        // Callback after animation
        var $target = $("#chart-container");
        $target.focus();
        if ($target.is(":focus")) { // Checking if the target was focused
          return false;
        } else {
          $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
          $target.focus(); // Set focus again
        };
      });
    }
  });
