/* Wishly — Supabase backend bridge
   Works with the existing Wishly frontend.
   Public/publishable key only — NEVER put a secret/service key here.
*/

(() => {
  const SUPABASE_URL = "https://vhkxcnpgnmnophacsilx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9JFL6aPX2-iGnfq2ibxoww_q8s1i9bT";

  const IMAGE_BUCKET = "wishly-images";
  const MUSIC_BUCKET = "wishly-music";

  let sb = null;

  const waitFor = (fn, tries = 100) => new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      try {
        const value = fn();
        if (value) return resolve(value);
      } catch (_) {}
      if (++n >= tries) return reject(new Error("Wishly frontend did not finish loading."));
      setTimeout(tick, 100);
    };
    tick();
  });

  function setStatus(message, good = false) {
    let box = document.getElementById("wishlyBackendStatus");
    if (!box) {
      box = document.createElement("div");
      box.id = "wishlyBackendStatus";
      Object.assign(box.style, {
        position: "fixed",
        left: "50%",
        bottom: "22px",
        transform: "translateX(-50%)",
        zIndex: "9999",
        maxWidth: "min(680px,92vw)",
        padding: "12px 16px",
        borderRadius: "999px",
        background: "rgba(255,255,255,.94)",
        border: "1px solid rgba(74,51,65,.12)",
        boxShadow: "0 18px 50px rgba(70,40,60,.18)",
        color: "#6d4d5d",
        font: "700 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
        textAlign: "center",
        backdropFilter: "blur(14px)"
      });
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.color = good ? "#47755a" : "#6d4d5d";
  }

  function makeFileName(prefix, file) {
    const clean = (file?.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${crypto.randomUUID()}-${prefix}-${clean}`;
  }

  async function uploadFile(bucket, file, prefix) {
    if (!file) return null;

    const path = makeFileName(prefix, file);

    const { error } = await sb.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
        cacheControl: "31536000"
      });

    if (error) throw new Error(`${prefix} upload failed: ${error.message}`);

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveWish() {
    if (!sb) throw new Error("Supabase is not ready.");

    readForm();

    const imageFiles = state.photos.filter(Boolean);

    const totalUploads =
      imageFiles.length +
      (state.customImage ? 1 : 0) +
      (state.finalImage ? 1 : 0) +
      (state.musicFile ? 1 : 0);

    let done = 0;

    const progress = () => {
      done++;
      setStatus(`Saving your Wishly… ${done}/${totalUploads || 1}`);
    };

    const memories = [];

    for (let i = 0; i < state.photos.length; i++) {
      const file = state.photos[i];

      if (!file) continue;

      const url = await uploadFile(
        IMAGE_BUCKET,
        file,
        `memory-${i + 1}`
      );

      progress();

      memories.push({
        url,
        caption:
          state.captions[i] ||
          "A little memory worth keeping. ❤️"
      });
    }

    let finalImageUrl = null;

    if (state.finalImage) {
      finalImageUrl = await uploadFile(
        IMAGE_BUCKET,
        state.finalImage,
        "final"
      );

      progress();
    }

    let customImageUrl = null;

    if (state.customImage) {
      customImageUrl = await uploadFile(
        IMAGE_BUCKET,
        state.customImage,
        "custom"
      );

      progress();
    }

    let musicUrl = null;

    if (state.musicFile) {
      musicUrl = await uploadFile(
        MUSIC_BUCKET,
        state.musicFile,
        "music"
      );

      progress();
    }

    const customSlide = state.customImage
      ? {
          image_url: customImageUrl,
          title: state.customTitle || "",
          small: state.customSmall || "",
          animation: state.customAnimation || "Float"
        }
      : {};

    const shareToken = crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 18);

    const row = {
      share_token: shareToken,
      category: state.category || "Birthday",
      recipient_name: state.name || "Someone special",
      special_date:
        document.getElementById("birthday")?.value || null,
      language:
        document.getElementById("language")?.value || "English",
      tone: "Cute & Romantic",
      message: state.message || "",
      memory_line: state.memoryLine || "",
      ending_message: state.endingMessage || "",
      final_title: state.finalTitle || "",
      extras: Array.isArray(state.extras)
        ? state.extras
        : [],
      custom_slide: customSlide,
      memories,
      final_image_url: finalImageUrl,
      music_url: musicUrl,
      payment_status: "paid",
      amount: 0,
      status: "published"
    };

    const { error } = await sb
      .from("wishes")
      .insert(row);

    if (error) {
      throw new Error(
        `Database save failed: ${error.message}`
      );
    }

    return {
      share_token: shareToken
    };
  }

  function showShareLink(token) {
    const url =
      `${location.origin}${location.pathname}?wish=${encodeURIComponent(token)}`;

    let modal =
      document.getElementById("wishlyShareModal");

    if (!modal) {
      modal = document.createElement("div");

      modal.id = "wishlyShareModal";

      modal.innerHTML = `
        <div class="wishlyShareBackdrop"></div>

        <div class="wishlyShareCard">

          <div class="wishlyShareIcon">
            ✨
          </div>

          <h2>
            Your Wishly is ready!
          </h2>

          <p>
            Your share link has been created successfully.
          </p>

          <input
            id="wishlyShareInput"
            readonly
          >

          <div class="wishlyShareActions">

            <button id="wishlyCopyLink">
              Copy Link
            </button>

            <button id="wishlyOpenLink">
              Open Experience
            </button>

          </div>

          <button
            id="wishlyCloseShare"
            class="wishlyCloseShare"
          >
            Continue editing
          </button>

        </div>
      `;

      document.body.appendChild(modal);

      const style =
        document.createElement("style");

      style.textContent = `
        #wishlyShareModal{
          position:fixed;
          inset:0;
          z-index:10000;
          display:grid;
          place-items:center;
        }

        .wishlyShareBackdrop{
          position:absolute;
          inset:0;
          background:rgba(40,20,35,.42);
          backdrop-filter:blur(10px);
        }

        .wishlyShareCard{
          position:relative;
          width:min(560px,92vw);
          padding:32px;
          border-radius:30px;
          background:rgba(255,250,253,.97);
          border:1px solid rgba(74,51,65,.1);
          box-shadow:0 30px 100px rgba(50,25,45,.28);
          text-align:center;
          color:#6d4d5d;
        }

        .wishlyShareIcon{
          font-size:58px;
          animation:wishlyFloat 3s ease-in-out infinite;
        }

        .wishlyShareCard h2{
          margin-top:8px;
          font-size:34px;
        }

        .wishlyShareCard p{
          margin:9px 0 20px;
          color:#927b89;
        }

        #wishlyShareInput{
          width:100%;
          padding:13px 14px;
          border:1px solid #eadbe2;
          border-radius:14px;
          background:#fff;
          color:#6d4d5d;
          outline:none;
        }

        .wishlyShareActions{
          display:flex;
          gap:9px;
          margin-top:12px;
        }

        .wishlyShareActions button{
          flex:1;
          border:0;
          border-radius:14px;
          padding:13px 15px;
          font-weight:850;
          cursor:pointer;
          color:white;
          background:
            linear-gradient(
              135deg,
              #ef91b5,
              #b8a6ed
            );
        }

        .wishlyShareActions button:first-child{
          color:#765a68;
          background:#fff0f5;
          border:1px solid #f2d4e1;
        }

        .wishlyCloseShare{
          margin-top:15px;
          border:0;
          background:none;
          color:#9b7f8e;
          cursor:pointer;
        }

        @keyframes wishlyFloat{
          50%{
            transform:
              translateY(-7px)
              rotate(3deg);
          }
        }
      `;

      document.head.appendChild(style);

      document.getElementById(
        "wishlyCopyLink"
      ).onclick = async () => {

        const input =
          document.getElementById(
            "wishlyShareInput"
          );

        try {

          await navigator.clipboard.writeText(
            input.value
          );

          document.getElementById(
            "wishlyCopyLink"
          ).textContent = "Copied ✓";

          setTimeout(() => {
            document.getElementById(
              "wishlyCopyLink"
            ).textContent = "Copy Link";
          }, 1400);

        } catch {

          input.select();

          document.execCommand("copy");
        }
      };

      document.getElementById(
        "wishlyOpenLink"
      ).onclick = () => {
        window.open(url, "_blank");
      };

      document.getElementById(
        "wishlyCloseShare"
      ).onclick = () => modal.remove();
    }

    document.getElementById(
      "wishlyShareInput"
    ).value = url;

    modal.style.display = "grid";
  }

  function installCreatorSave() {

    const next =
      document.getElementById("nextBtn");

    if (
      !next ||
      next.dataset.wishlyBackendInstalled
    ) return;

    next.dataset.wishlyBackendInstalled = "1";

    next.addEventListener(
      "click",
      async (event) => {

        if (state.step !== 4) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        try {

          next.disabled = true;
          next.textContent = "Saving ✨";

          setStatus(
            "Preparing your Wishly…"
          );

          const result =
            await saveWish();

          /*
            Remove backend status immediately.
            The creator page does not need the
            floating status pill after saving.
          */
          const status =
            document.getElementById(
              "wishlyBackendStatus"
            );

          if (status) status.remove();

          showShareLink(
            result.share_token
          );

          next.disabled = false;
          next.textContent =
            "Preview Experience ✨";

        } catch (error) {

          console.error(error);

          setStatus(
            `❌ ${error.message}`
          );

          next.disabled = false;

          next.textContent =
            "Preview Experience ✨";

          alert(error.message);
        }

      },
      true
    );
  }

  function patchObjectURLForRemoteFiles() {

    const original =
      URL.createObjectURL.bind(URL);

    if (URL.__wishlyPatched) return;

    URL.__wishlyPatched = true;

    URL.createObjectURL = value => {

      if (
        value &&
        typeof value === "object" &&
        value.__wishlyRemoteUrl
      ) {
        return value.__wishlyRemoteUrl;
      }

      return original(value);
    };
  }

  function remoteFile(url) {

    return url
      ? {
          __wishlyRemoteUrl: url
        }
      : null;
  }

  async function loadPublicWish(token) {

    const {
      data,
      error
    } = await sb.rpc(
      "get_wish_by_token",
      {
        token
      }
    );

    if (error) {
      throw new Error(
        `Could not load Wishly: ${error.message}`
      );
    }

    if (!data || !data.length) {
      throw new Error(
        "This Wishly link is invalid or unavailable."
      );
    }

    const wish = data[0];

    state.category =
      wish.category || "Birthday";

    state.name =
      wish.recipient_name ||
      "Someone special";

    state.message =
      wish.message || "";

    state.memoryLine =
      wish.memory_line || "";

    state.endingMessage =
      wish.ending_message || "";

    state.finalTitle =
      wish.final_title || "";

    state.extras =
      Array.isArray(wish.extras)
        ? wish.extras
        : [];

    state.photos =
      [null, null, null, null];

    state.captions =
      ["", "", "", ""];

    const memories =
      Array.isArray(wish.memories)
        ? wish.memories
        : [];

    memories
      .slice(0, 4)
      .forEach((m, i) => {

        state.photos[i] =
          remoteFile(m.url);

        state.captions[i] =
          m.caption || "";
      });

    const custom =
      wish.custom_slide || {};

    state.customImage =
      remoteFile(custom.image_url);

    state.customTitle =
      custom.title || "";

    state.customSmall =
      custom.small || "";

    state.customAnimation =
      custom.animation || "Float";

    state.finalImage =
      remoteFile(
        wish.final_image_url
      );

    state.musicFile =
      remoteFile(
        wish.music_url
      );

    state.musicChoice =
      wish.music_url
        ? "custom"
        : "none";

    state.blown = false;
    state.expIndex = 0;

    patchObjectURLForRemoteFiles();

    const home =
      document.getElementById("home");

    const creator =
      document.getElementById("creator");

    if (home) {
      home.style.display = "none";
    }

    if (creator) {
      creator.classList.remove("active");
    }

    await waitFor(
      () =>
        typeof renderExperience ===
          "function" &&
        typeof showExpSlide ===
          "function"
    );

    renderExperience();

    /*
      IMPORTANT:
      Do NOT show the temporary
      "Enjoy your Wishly ✨" status pill
      on the public experience page.
    */
    const status =
      document.getElementById(
        "wishlyBackendStatus"
      );

    if (status) {
      status.remove();
    }
  }

  async function boot() {

    await waitFor(
      () =>
        window.supabase &&
        typeof window.supabase
          .createClient === "function"
    );

    sb =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    patchObjectURLForRemoteFiles();

    const token =
      new URLSearchParams(
        location.search
      ).get("wish");

    if (token) {

      try {

        /*
          Don't create a visible
          "Enjoy your Wishly" status.
          Load the experience directly.
        */
        await loadPublicWish(token);

      } catch (error) {

        console.error(error);

        setStatus(
          `❌ ${error.message}`
        );

        alert(error.message);
      }

      return;
    }

    installCreatorSave();
  }

  /*
    Load Supabase JS without changing
    the existing Wishly HTML.
  */
  const script =
    document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  script.onload = () =>
    boot().catch(console.error);

  script.onerror = () =>
    setStatus(
      "❌ Could not load Supabase."
    );

  document.head.appendChild(script);

})();
