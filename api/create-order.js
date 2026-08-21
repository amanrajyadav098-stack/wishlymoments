export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { amount } = req.body || {};

    if (![29, 17].includes(Number(amount))) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay environment variables are missing"
      });
    }

    const receipt =
      `wishly_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const auth =
      Buffer
        .from(`${keyId}:${keySecret}`)
        .toString("base64");

    const response =
      await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Basic ${auth}`
          },

          body: JSON.stringify({
            amount:
              Number(amount) * 100,

            currency:
              "INR",

            receipt:
              receipt,

            notes: {
              product:
                "Wishly",

              price:
                Number(amount)
            }
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Razorpay order error:",
        data
      );

      return res.status(
        response.status
      ).json({
        error:
          data.error?.description ||
          "Could not create Razorpay order"
      });
    }

    return res.status(200).json({
      order_id:
        data.id,

      amount:
        data.amount,

      currency:
        data.currency,

      key_id:
        keyId
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}
