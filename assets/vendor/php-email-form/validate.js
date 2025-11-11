(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach(function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;

      // ------------------------------------------------------------------
      // ----- START: CUSTOM CLIENT-SIDE VALIDATION -----
      // ------------------------------------------------------------------

      // --- Select form fields for validation ---
      const nameInput = thisForm.querySelector('#name-field');
      const mobileInput = thisForm.querySelector('#mobile-field');
      const emailInput = thisForm.querySelector('#email-field');
      const serviceCheckboxes = thisForm.querySelectorAll('input[name="services[]"]:checked');
      const serviceDropdownButton = thisForm.querySelector('#services-dropdown');

      let errors = [];

      // --- Clear previous validation states ---
      thisForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

      // 1. Validate Name (Mandatory)
      if (nameInput.value.trim() === '') {
        errors.push('Name is required.');
        nameInput.classList.add('is-invalid');
      }

      // 2. Validate Mobile Number (Mandatory & 10 digits)
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(mobileInput.value.trim())) {
        errors.push('Please enter a valid 10-digit mobile number.');
        mobileInput.classList.add('is-invalid');
      }

      // 3. Validate Email (Mandatory & correct format)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        errors.push('Please enter a valid email address.');
        emailInput.classList.add('is-invalid');
      }

      // 4. Validate Services (At least one must be checked)
      if (serviceCheckboxes.length === 0) {
        errors.push('Please select at least one service.');
        serviceDropdownButton.classList.add('is-invalid'); // Highlight the dropdown button
      }

      // --- If there are any errors, display them and STOP ---
      if (errors.length > 0) {
        // The displayError function is already provided by the template
        displayError(thisForm, errors.join('<br>'));
        return; // Stop the form submission process
      }
      // ------------------------------------------------------------------
      // ----- END: CUSTOM CLIENT-SIDE VALIDATION -----
      // ------------------------------------------------------------------


      // --- Original script logic continues below if validation passes ---

      let action = thisForm.getAttribute('action');
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if( ! action ) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }
      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

      let formData = new FormData( thisForm );

      if ( recaptcha ) {
        if(typeof grecaptcha !== "undefined" ) {
          grecaptcha.ready(function() {
            try {
              grecaptcha.execute(recaptcha, {action: 'php_email_form_submit'})
              .then(token => {
                formData.set('recaptcha-response', token);
                php_email_form_submit(thisForm, action, formData);
              })
            } catch(error) {
              displayError(thisForm, error);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha javascript API url is not loaded!')
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });

  function php_email_form_submit(thisForm, action, formData) {
    fetch(action, {
      method: 'POST',
      body: formData,
      headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
    .then(response => {
      if( response.ok ) {
        return response.text();
      } else {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`); 
      }
    })
    .then(data => {
      thisForm.querySelector('.loading').classList.remove('d-block');
      if (data.trim() == 'OK') {
        thisForm.querySelector('.sent-message').classList.add('d-block');
        thisForm.reset(); 
        // Also remove any invalid classes on success
        thisForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      } else {
        throw new Error(data ? data : 'Form submission failed and no error message returned from: ' + action); 
      }
    })
    .catch((error) => {
      displayError(thisForm, error);
    });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    thisForm.querySelector('.error-message').innerHTML = error;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();