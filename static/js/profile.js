/* Day-Check Profile interactions.
 * No localStorage/sessionStorage is used. The server remains the source of truth.
 */
(() => {
  "use strict";

  const config = window.DAY_CHECK_PROFILE_CONFIG || {};
  const pictureModal = document.getElementById("pictureModal");
  const choices = Array.from(document.querySelectorAll(".avatar-choice"));
  const savePictureButton = document.getElementById("savePictureButton");
  const preview = document.getElementById("profilePhotoPreview");
  const headerAvatar = document.querySelector(".header-avatar");
  const missingNotice = document.getElementById("avatarMissingNotice");
  let selectedPicture = config.currentPicture || "";
  let pendingPicture = selectedPicture;

  const quotes = [
    "Small steps every day lead to big changes.",
    "Consistency turns intention into progress.",
    "Your habits shape the direction of your days.",
    "Progress is built one purposeful day at a time."
  ];
  const quoteNode = document.getElementById("dailyQuote");
  if (quoteNode) {
    // Rotate a simple motivational quote on page load; no user data is stored.
    quoteNode.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  }

  function renderSelectedPicture(path) {
    if (preview) {
      preview.replaceChildren();
      const image = document.createElement("img");
      image.src = `${window.location.origin}${window.DAY_CHECK_STATIC_URL || "/static/"}${path}`;
      image.alt = "Profile picture";
      preview.appendChild(image);
    }
    if (headerAvatar) {
      headerAvatar.replaceChildren();
      const image = document.createElement("img");
      image.src = `${window.location.origin}${window.DAY_CHECK_STATIC_URL || "/static/"}${path}`;
      image.alt = "Your profile picture";
      headerAvatar.appendChild(image);
    }
  }

  function updateChoiceState() {
    choices.forEach((choice) => {
      const active = choice.dataset.picture === pendingPicture;
      choice.classList.toggle("selected", active);
      choice.setAttribute("aria-pressed", String(active));
    });
    savePictureButton.disabled = !pendingPicture || pendingPicture === selectedPicture;
  }

  choices.forEach((choice) => {
    const image = choice.querySelector("img");
    image?.addEventListener("error", () => {
      choice.classList.add("avatar-missing");
      image.hidden = true;
      if (missingNotice) missingNotice.classList.remove("d-none");
      // An absent image is not a valid selectable picture.
      choice.disabled = true;
      if (pendingPicture === choice.dataset.picture) pendingPicture = selectedPicture;
      updateChoiceState();
    });
    choice.addEventListener("click", () => {
      if (choice.disabled) return;
      pendingPicture = choice.dataset.picture;
      updateChoiceState();
    });
  });

  pictureModal?.addEventListener("show.bs.modal", () => {
    pendingPicture = selectedPicture;
    updateChoiceState();
  });

  savePictureButton?.addEventListener("click", async () => {
    if (!pendingPicture || !config.pictureUpdateUrl) return;

    // Backend integration point: the Flask endpoint must authenticate the user,
    // validate the submitted path against the four allowed filenames, and persist
    // it to the user's record. Never trust a client-provided path without allow-listing.
    savePictureButton.disabled = true;
    savePictureButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Saving';

    try {
      const csrf = document.querySelector('#editProfileForm input[name="csrf_token"]')?.value || "";
      const response = await fetch(config.pictureUpdateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
          "Accept": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ profile_picture: pendingPicture })
      });
      if (!response.ok) throw new Error("The server could not save this picture.");
      const result = await response.json();
      if (result.success !== true) throw new Error(result.message || "Picture update was not confirmed.");

      selectedPicture = pendingPicture;
      config.currentPicture = selectedPicture;
      renderSelectedPicture(selectedPicture);
      bootstrap.Modal.getOrCreateInstance(pictureModal).hide();
    } catch (error) {
      // Do not show a false success when the Flask endpoint is not implemented.
      window.alert(error.message || "Unable to save your profile picture. Please try again.");
    } finally {
      savePictureButton.textContent = "Save changes";
      updateChoiceState();
    }
  });

  // Client-side convenience checks only. Server-side validation is mandatory.
  const editForm = document.getElementById("editProfileForm");
  editForm?.addEventListener("submit", (event) => {
    const fullName = document.getElementById("editFullName");
    const dob = document.getElementById("editDob");
    const errorBox = document.getElementById("profileFormError");
    errorBox.classList.add("d-none");
    errorBox.textContent = "";

    if (fullName.value.trim().length > 120) {
      event.preventDefault();
      errorBox.textContent = "Full name must be 120 characters or fewer.";
      errorBox.classList.remove("d-none");
      fullName.focus();
      return;
    }
    if (dob.value && dob.value > new Date().toISOString().slice(0, 10)) {
      event.preventDefault();
      errorBox.textContent = "Date of birth cannot be in the future.";
      errorBox.classList.remove("d-none");
      dob.focus();
    }
  });

  updateChoiceState();
})();
