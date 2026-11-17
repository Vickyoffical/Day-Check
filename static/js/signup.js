// Day-Check registration form interactions and client-side validation.
(() => {
  "use strict";

  const form = document.getElementById("signupForm");
  const username = document.getElementById("username");
  const dob = document.getElementById("date_of_birth");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm_password");
  const alertBox = document.getElementById("formAlert");
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");
  const googleButton = document.getElementById("googleSignup");

  // A date input's max attribute prevents choosing a future date in the browser.
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  dob.max = localToday;
  document.getElementById("currentYear").textContent = today.getFullYear();

  const rules = {
    length: value => value.length >= 8,
    upper: value => /[A-Z]/.test(value),
    lower: value => /[a-z]/.test(value),
    number: value => /\d/.test(value),
    special: value => /[^A-Za-z0-9]/.test(value)
  };

  function passwordChecks(value) {
    return Object.fromEntries(Object.entries(rules).map(([key, test]) => [key, test(value)]));
  }

  function passwordIsValid(value) {
    return Object.values(passwordChecks(value)).every(Boolean);
  }

  function updateStrength() {
    const checks = passwordChecks(password.value);
    const score = Object.values(checks).filter(Boolean).length;
    const labels = ["Password strength", "Weak", "Fair", "Good", "Strong", "Strong"];
    const widths = ["0%", "20%", "40%", "60%", "80%", "100%"];
    strengthBar.style.width = widths[score];
    strengthBar.style.background = score <= 2 ? "#dc6672" : score <= 3 ? "#e6a44f" : "#42b883";
    strengthText.textContent = password.value ? labels[score] : labels[0];

    document.querySelectorAll("#passwordRules li").forEach(item => {
      const passed = checks[item.dataset.rule];
      item.classList.toggle("passed", passed);
      const icon = item.querySelector("i");
      icon.className = passed ? "bi bi-check-circle-fill" : "bi bi-circle";
    });
    validatePassword(false);
    validateConfirm(false);
  }

  function setValidity(input, valid) {
    input.classList.toggle("is-valid", valid);
    input.classList.toggle("is-invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
    return valid;
  }

  function validateUsername(show = true) {
    const valid = /^[A-Za-z0-9_]{3,24}$/.test(username.value.trim());
    if (show || username.value) setValidity(username, valid);
    return valid;
  }

  function validateDob(show = true) {
    const value = dob.value;
    const valid = Boolean(value) && value <= localToday && !Number.isNaN(Date.parse(value));
    if (show || value) setValidity(dob, valid);
    return valid;
  }

  function validateEmail(show = true) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    if (show || email.value) setValidity(email, valid);
    return valid;
  }

  function validatePassword(show = true) {
    const valid = passwordIsValid(password.value);
    if (show || password.value) setValidity(password, valid);
    return valid;
  }

  function validateConfirm(show = true) {
    const valid = Boolean(confirmPassword.value) && confirmPassword.value === password.value;
    if (show || confirmPassword.value) setValidity(confirmPassword, valid);
    return valid;
  }

  // Toggle visibility without changing the underlying form value.
  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.togglePassword);
      const reveal = target.type === "password";
      target.type = reveal ? "text" : "password";
      button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
      button.setAttribute("aria-pressed", String(reveal));
      button.innerHTML = reveal ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  });

  username.addEventListener("input", () => validateUsername(false));
  dob.addEventListener("change", () => validateDob(false));
  email.addEventListener("input", () => validateEmail(false));
  password.addEventListener("input", updateStrength);
  confirmPassword.addEventListener("input", () => validateConfirm(false));

  function showAlert(message, type) {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("submit", event => {
    const results = [
      validateUsername(true),
      validateDob(true),
      validateEmail(true),
      validatePassword(true),
      validateConfirm(true)
    ];
    if (results.some(result => !result)) {
      event.preventDefault();
      showAlert("Please review the highlighted fields and correct the information before continuing.", "danger");
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Valid forms submit normally using POST to /register for Flask integration.
    // The backend should revalidate all fields and hash the password with Werkzeug.
    alertBox.classList.add("d-none");
  });

  // No fake OAuth success: this is a clear integration placeholder.
  googleButton.addEventListener("click", () => {
    showAlert("Google sign-in is not connected yet. Please use the registration form for now.", "info");
  });
})();