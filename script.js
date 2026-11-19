/* ============================================================
   KHR Corporate & Tax Consultants — site interactions
   - Mobile navigation toggle
   - Contact form: validation + delivery
   ============================================================ */

/* ----------------------------------------------------------------
   CONFIG
   ----------------------------------------------------------------
   By default, contact-form enquiries are handed off to WhatsApp so
   they reach the business immediately — no backend required.

   To receive submissions silently by EMAIL instead, create a free
   form endpoint (e.g. Formspree → https://formspree.io) and paste
   the URL below. Once set, the form POSTs there and only falls back
   to WhatsApp if the network request fails.

       FORM_ENDPOINT = "https://formspree.io/f/your-id";
   ---------------------------------------------------------------- */
var FORM_ENDPOINT = "";
// The WhatsApp number comes from the phone number set in the admin panel
// (the build writes it onto <body data-wa="...">); this is only a fallback.
var WHATSAPP_NUMBER = (document.body && document.body.getAttribute("data-wa")) || "923138561601";

var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ---------------- Mobile navigation ---------------- */
function toggleMobile() {
  var m = document.getElementById("mobileMenu");
  if (m) m.classList.toggle("open");
}

function closeMobile() {
  var m = document.getElementById("mobileMenu");
  if (m) m.classList.remove("open");
}

/* ---------------- Contact form ---------------- */
function fieldValue(id) {
  var el = document.getElementById(id);
  return el ? (el.value || "") : "";
}

function setError(id, show) {
  var el = document.getElementById(id);
  if (el) el.style.display = show ? "block" : "none";
}

function showSuccess() {
  var view = document.getElementById("formView");
  var success = document.getElementById("formSuccess");
  if (view) view.style.display = "none";
  if (success) success.style.display = "block";
}

function buildEnquiryText(d) {
  var lines = [
    "New enquiry from the KHR website:",
    "Name: " + d.name,
    "Email: " + d.email
  ];
  if (d.phone) lines.push("Phone: " + d.phone);
  lines.push("Service: " + d.service);
  if (d.message) lines.push("Message: " + d.message);
  return lines.join("\n");
}

function openWhatsApp(d) {
  var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildEnquiryText(d));
  window.open(url, "_blank", "noopener");
}

function submitForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  var data = {
    name: fieldValue("f-name").trim(),
    email: fieldValue("f-email").trim(),
    phone: fieldValue("f-phone").trim(),
    service: fieldValue("f-service").trim(),
    message: fieldValue("f-msg").trim()
  };

  var errName = data.name.length === 0;
  var errEmail = !EMAIL_RE.test(data.email);
  setError("err-name", errName);
  setError("err-email", errEmail);
  if (errName || errEmail) return false;

  if (FORM_ENDPOINT) {
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (r) {
        if (r.ok) {
          showSuccess();
        } else {
          openWhatsApp(data);
          showSuccess();
        }
      })
      .catch(function () {
        openWhatsApp(data);
        showSuccess();
      });
  } else {
    openWhatsApp(data);
    showSuccess();
  }

  return false;
}
