(() => {
  "use strict";

  const COUPON = "WISH17";
  const ORIGINAL_PRICE = 29;
  const DISCOUNT_PRICE = 17;

  let paymentModal = null;
  let paymentBusy = false;

  function money(n) {
    return `₹${n}`;
  }

  function createModal() {
    if (paymentModal) return paymentModal;

    paymentModal = document.createElement("div");

    paymentModal.id = "wishlyPaymentModal";

    paymentModal.innerHTML = `
      <div class="wp-backdrop"></div>

      <div class="wp-card">

        <button class="wp-close" id="wpClose">×</button>

        <div class="wp-icon">✨</div>

        <h2>Create your Wishly</h2>

        <p class="wp-sub">
          One beautiful moment, ready to share.
        </p>

        <div class="wp-price-box">
          <div>
            <span class="wp-label">Wishly</span>
            <strong id="wpPrice">${money(ORIGINAL_PRICE)}</strong>
          </div>

          <div id="wpDiscountRow" class="wp-discount hidden">
            Coupon applied ✓
          </div>
        </div>

        <div class="wp-coupon">
          <input
            id="wpCoupon"
            type="text"
            placeholder="Enter coupon code"
            autocomplete="off"
          >

          <button id="wpApply">
            Apply
          </button>
        </div>

        <div id="wpCouponMessage" class="wp-message"></div>

        <button id="wpPay" class="wp-pay">
          Pay ${money(ORIGINAL_PRICE)} →
        </button>

        <div class="wp-secure">
          🔒 Secure payment powered by Razorpay
        </div>

      </div>
    `;

    const style = document.createElement("style");

    style.textContent = `
      #wishlyPaymentModal{
        position:fixed;
        inset:0;
        z-index:999999;
        display:grid;
        place-items:center;
        font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
      }

      .wp-backdrop{
        position:absolute;
        inset:0;
        background:rgba(40,20,35,.45);
        backdrop-filter:blur(12px);
      }

      .wp-card{
        position:relative;
        z-index:2;
        width:min(470px,92vw);
        padding:32px;
        border-radius:30px;
        background:rgba(255,250,253,.98);
        border:1px solid rgba(74,51,65,.1);
        box-shadow:0 30px 100px rgba(50,25,45,.28);
        text-align:center;
        color:#6d4d5d;
        animation:wpIn .35s ease;
      }

      @keyframes wpIn{
        from{
          opacity:0;
          transform:translateY(20px) scale(.97);
        }
        to{
          opacity:1;
          transform:translateY(0) scale(1);
        }
      }

      .wp-close{
        position:absolute;
        right:16px;
        top:13px;
        width:38px;
        height:38px;
        border:0;
        border-radius:50%;
        background:#fff0f5;
        color:#795b69;
        font-size:27px;
        cursor:pointer;
      }

      .wp-icon{
        font-size:52px;
        margin-bottom:5px;
      }

      .wp-card h2{
        margin:0;
        font-size:30px;
      }

      .wp-sub{
        margin:9px 0 22px;
        color:#927b89;
        line-height:1.5;
      }

      .wp-price-box{
        padding:18px;
        border-radius:20px;
        background:linear-gradient(
          135deg,
          #fff1f6,
          #f2edff
        );
        border:1px solid #efdce5;
      }

      .wp-price-box > div:first-child{
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .wp-label{
        font-weight:800;
        color:#7b5c6c;
      }

      #wpPrice{
        font-size:30px;
        color:#6c4c5d;
      }

      .wp-discount{
        margin-top:7px;
        color:#4d8062;
        font-size:13px;
        font-weight:800;
      }

      .hidden{
        display:none!important;
      }

      .wp-coupon{
        display:flex;
        gap:8px;
        margin-top:17px;
      }

      .wp-coupon input{
        flex:1;
        width:auto;
        margin:0;
        padding:13px 14px;
        border:1px solid #ead9e1;
        border-radius:14px;
        outline:none;
        background:#fff;
        color:#543c4b;
      }

      .wp-coupon input:focus{
        border-color:#ee9abc;
        box-shadow:0 0 0 3px rgba(238,154,188,.1);
      }

      #wpApply{
        border:0;
        border-radius:14px;
        padding:0 18px;
        background:#fff0f5;
        border:1px solid #f2d4e1;
        color:#765a68;
        font-weight:850;
        cursor:pointer;
      }

      .wp-message{
        min-height:22px;
        margin-top:9px;
        font-size:13px;
        font-weight:700;
      }

      .wp-pay{
        width:100%;
        margin-top:9px;
        padding:15px 18px;
        border:0;
        border-radius:15px;
        color:white;
        font-weight:900;
        font-size:16px;
        cursor:pointer;
        background:linear-gradient(
          135deg,
          #ef91b5,
          #b8a6ed
        );
        box-shadow:0 14px 32px rgba(233,138,177,.22);
      }

      .wp-pay:disabled{
        opacity:.55;
        cursor:not-allowed;
      }

      .wp-secure{
        margin-top:14px;
        color:#9a8390;
        font-size:12px;
      }

      @media(max-width:500px){
        .wp-card{
          padding:25px 18px;
        }

        .wp-card h2{
          font-size:26px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(paymentModal);

    const close = () => {
      if (paymentModal) {
        paymentModal.remove();
        paymentModal = null;
      }
    };

    document.getElementById("wpClose").onclick = close;

    document.querySelector("#wishlyPaymentModal .wp-backdrop")
      .onclick = close;

    document.getElementById("wpApply").onclick = applyCoupon;

    document.getElementById("wpCoupon").addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          applyCoupon();
        }
      }
    );

    document.getElementById("wpPay").onclick =
      startPayment;

    return paymentModal;
  }

  function applyCoupon() {
    const input =
      document.getElementById("wpCoupon");

    const message =
      document.getElementById("wpCouponMessage");

    const price =
      document.getElementById("wpPrice");

    const discount =
      document.getElementById("wpDiscountRow");

    const pay =
      document.getElementById("wpPay");

    if (!input || !message || !price || !pay) return;

    const code =
      input.value.trim().toUpperCase();

    if (code === COUPON) {
      price.textContent =
        money(DISCOUNT_PRICE);

      discount.classList.remove("hidden");

      message.textContent =
        "Coupon applied! You saved ₹12 🎉";

      message.style.color =
        "#4d8062";

      pay.textContent =
        `Pay ${money(DISCOUNT_PRICE)} →`;

      pay.dataset.amount =
        String(DISCOUNT_PRICE);

      input.disabled = true;

      document.getElementById("wpApply").disabled =
        true;

    } else {
      price.textContent =
        money(ORIGINAL_PRICE);

      discount.classList.add("hidden");

      message.textContent =
        "Invalid coupon code.";

      message.style.color =
        "#b85b72";

      pay.textContent =
        `Pay ${money(ORIGINAL_PRICE)} →`;

      pay.dataset.amount =
        String(ORIGINAL_PRICE);
    }
  }

  async function loadRazorpay() {
    if (window.Razorpay) {
      return true;
    }

    return new Promise(resolve => {
      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () =>
        resolve(true);

      script.onerror = () =>
        resolve(false);

      document.head.appendChild(script);
    });
  }

  async function createOrder(amount) {
    const response =
      await fetch("/api/create-order.js", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          amount
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not create payment order."
      );
    }

    return data;
  }

  async function verifyPayment(response) {
    const result =
      await fetch("/api/verify-payment.js", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          razorpay_order_id:
            response.razorpay_order_id,

          razorpay_payment_id:
            response.razorpay_payment_id,

          razorpay_signature:
            response.razorpay_signature
        })
      });

    const data =
      await result.json();

    if (!result.ok || !data.success) {
      throw new Error(
        data.error ||
        "Payment verification failed."
      );
    }

    return data;
  }

  async function startPayment() {
    if (paymentBusy) return;

    paymentBusy = true;

    const pay =
      document.getElementById("wpPay");

    const couponInput =
      document.getElementById("wpCoupon");

    const amount =
      Number(pay?.dataset.amount || 29);

    /*
      ₹17 is allowed only after the correct
      coupon has been entered.
    */
    if (
      amount === 17 &&
      couponInput?.value.trim().toUpperCase() !== COUPON
    ) {
      paymentBusy = false;

      alert(
        "Please apply the valid coupon first."
      );

      return;
    }

    try {
      if (pay) {
        pay.disabled = true;
        pay.textContent =
          "Opening secure payment…";
      }

      const razorpayReady =
        await loadRazorpay();

      if (!razorpayReady) {
        throw new Error(
          "Razorpay could not be loaded. Please try again."
        );
      }

      const order =
        await createOrder(amount);

      const options = {
        key: order.key_id,

        amount: order.amount,

        currency:
          order.currency || "INR",

        name: "Wishly",

        description:
          amount === 17
            ? "Wishly — Coupon Price"
            : "Wishly — Standard Price",

        order_id:
          order.order_id,

        theme: {
          color: "#ef91b5"
        },

        handler: async function(
          response
        ) {
          try {
            if (pay) {
              pay.textContent =
                "Verifying payment…";
            }

            await verifyPayment(
              response
            );

            /*
              Payment is verified.
              Now allow the existing Wishly
              Supabase save system to create
              the share link.
            */
            if (paymentModal) {
              paymentModal.remove();
              paymentModal = null;
            }

            await continueWishlySave();

          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(
              error.message ||
              "Payment verification failed."
            );

            if (pay) {
              pay.disabled = false;
              pay.textContent =
                `Pay ${money(amount)} →`;
            }

            paymentBusy = false;
          }
        },

        modal: {
          ondismiss: function() {
            paymentBusy = false;

            if (pay) {
              pay.disabled = false;
              pay.textContent =
                `Pay ${money(amount)} →`;
            }
          }
        }
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function() {
          paymentBusy = false;

          if (pay) {
            pay.disabled = false;
            pay.textContent =
              `Pay ${money(amount)} →`;
          }

          alert(
            "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.message ||
        "Something went wrong while starting payment."
      );

      paymentBusy = false;

      if (pay) {
        pay.disabled = false;
        pay.textContent =
          `Pay ${money(amount)} →`;
      }
    }
  }

  async function continueWishlySave() {
    /*
      The existing wishly-supabase.js already
      contains the Wish save/share-link system.
      We trigger its normal save flow after
      successful payment.
    */

    try {
      if (
        typeof window.saveWish ===
        "function"
      ) {
        const result =
          await window.saveWish();

        if (
          typeof window.showShareLink ===
          "function"
        ) {
          window.showShareLink(
            result.share_token
          );

          paymentBusy = false;
          return;
        }
      }

      /*
        Fallback: click the existing button
        so the existing backend handler can
        perform the save.
      */
      const next =
        document.getElementById("nextBtn");

      if (next) {
        next.dataset.paymentVerified =
          "1";

        next.disabled = false;

        next.click();

        paymentBusy = false;
        return;
      }

      throw new Error(
        "Wishly save system could not be found."
      );

    } catch (error) {
      console.error(
        "Wish save error:",
        error
      );

      alert(
        error.message ||
        "Payment succeeded, but the Wish could not be saved."
      );

      paymentBusy = false;
    }
  }

  function installPaymentInterceptor() {
    /*
      Run at document capture phase so this
      runs before the old nextBtn handler.
    */
    document.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest("#nextBtn");

        if (!button) return;

        if (
          typeof window.state ===
          "undefined"
        ) {
          return;
        }

        /*
          Only intercept the final creator step.
        */
        if (
          window.state.step !== 4
        ) {
          return;
        }

        /*
          If payment was already verified,
          let the normal Wishly save process
          continue.
        */
        if (
          button.dataset.paymentVerified ===
          "1"
        ) {
          delete button.dataset.paymentVerified;
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        createModal();

        const pay =
          document.getElementById("wpPay");

        if (pay) {
          pay.dataset.amount = "29";
          pay.textContent = "Pay ₹29 →";
        }

      },
      true
    );
  }

  function boot() {
    installPaymentInterceptor();

    console.log(
      "Wishly payment system ready."
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot
    );
  } else {
    boot();
  }

})();
