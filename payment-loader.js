(function () {
  "use strict";

  /*
   * WISHLY PAYMENT LOADER
   * Price: ₹29
   * Coupon: WISH17
   * Coupon price: ₹17
   */

  function loadPaymentSystem() {
    if (document.querySelector('script[data-wishly-payment]')) {
      return;
    }

    /*
     * Make the existing creator state available
     * to payment.js.
     */
    if (typeof window.state === "undefined") {
      try {
        if (typeof state !== "undefined") {
          window.state = state;
        }
      } catch (e) {}
    }

    const script = document.createElement("script");

    script.src = "./payment.js";
    script.async = false;
    script.dataset.wishlyPayment = "1";

    script.onload = function () {
      console.log("Wishly payment system loaded.");
    };

    script.onerror = function () {
      console.error("Wishly payment.js could not be loaded.");
    };

    document.body.appendChild(script);
  }

  /*
   * Wait until the existing Wishly page is ready.
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPaymentSystem);
  } else {
    loadPaymentSystem();
  }
})();
