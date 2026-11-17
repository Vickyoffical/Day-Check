/* Day-Check login interactions.
   Authentication itself is intentionally left to the Flask backend. */
(() => {
  "use strict";

  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const togglePassword = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton");
  const loginFeedback = document.getElementById("loginFeedback");
  const googleLoginButton = document.getElementById("googleLoginButton");
  const googleNote = document.getElementById("googleNote");

  document.getElementById("currentYear").textContent = new Date().getFullYear();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldError(input, messageElement, message) {
    messageElement.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateEmail() {
    const value = email.value.trim();
    let message = "";
    if (!value) {
      message = "Please enter your email address.";
    } else if (!emailPattern.test(value)) {
      message = "Please enter a valid email address.";
    }
    setFieldError(email, emailError, message);
    return !message;
  }

  function validatePassword() {
    const message = password.value ? "" : "Please enter your password.";
    setFieldError(password, passwordError, message);
    return !message;
  }

  email.addEventListener("blur", validateEmail);
  password.addEventListener("blur", validatePassword);
  email.addEventListener("input", () => {
    if (emailError.textContent) validateEmail();
  });
  password.addEventListener("input", () => {
    if (passwordError.textContent) validatePassword();
  });

  togglePassword.addEventListener("click", () => {
    const showing = password.type === "password";
    password.type = showing ? "text" : "password";
    togglePassword.innerHTML = showing
      ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
      : '<i class="bi bi-eye" aria-hidden="true"></i>';
    togglePassword.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    togglePassword.setAttribute("aria-pressed", String(showing));
  });

  form.addEventListener("submit", (event) => {
    const emailValid = validateEmail();
    const passwordValid = validatePassword();

    if (!emailValid || !passwordValid) {
      event.preventDefault();
      loginFeedback.hidden = true;
      (!emailValid ? email : password).focus();
      return;
    }

    // Allow the browser to POST to /login. Flask should authenticate credentials,
    // verify CSRF, apply the remember flag, and redirect on success.
    // The temporary loading state is reset if navigation/server response is delayed.
    loginButton.disabled = true;
    loginButton.querySelector(".button-label").hidden = true;
    loginButton.querySelector(".button-loading").hidden = false;
  });

  // Google OAuth is not active yet; make the placeholder explicit to users.
  googleLoginButton.addEventListener("click", () => {
    googleNote.hidden = false;
  });

  // Optional future Flask integration:
  // Render a server-side flash message into #loginFeedback and remove the hidden
  // attribute, adding .success only for a successful informational message.
})();
