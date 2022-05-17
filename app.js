const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const redis = require("redis");
const Stripe = require("stripe");
const stripe = Stripe("sk_test_4eC39HqLyjWDarjtT1zdp7dc");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

let client = redis.createClient({
  host: "localhost",
  port: 6123,
  password: "my secret",
  db: 1,
});

session({
  store: new RedisStore({ client }),
  saveUninitialized: false,
  secret: "amazing stuff",
  resave: false,
});

client.on("error", (err) => {
  console.log(err);
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});

const payment = async (amount, order_id) => {
  const res = await stripe.charges.create({
    amount: amount,
    currency: "usd",
    source: "tok_visa",
    metadata: { order_id: order_id },
  });
  if (res.paid === true) return true;
  else return false;
};

app.post("/payment", async (req, res) => {
  const { orderId, amount, idempotencyKey } = req.body;
  try {
    const resRedis = RedisStore[idempotencyKey];
    if (resRedis) {
      if (resRedis === "loading")
        res.status(200).send("0. Payment is already in progress");
      if (resRedis === "success") {
        res.status(200).send("1. Payment has already effected");
      } else {
        try {
          const resPayment = await payment(amount, orderId);
          if (resPayment) {
            RedisStore[idempotencyKey] = "success";
            res.status(200).send("2. Payment has been processed");
          } else {
            RedisStore[idempotencyKey] = "failed";
            res.status(500).send("3. Payment has not been processed");
          }
        } catch (err) {
          RedisStore[idempotencyKey] = "failed";
          res.status(500).send("4. Payment has not been processed");
        }
      }
    } else {
      RedisStore[idempotencyKey] = "loading";
      const resPayment = await payment(amount, orderId);
      if (resPayment) {
        RedisStore[idempotencyKey] = "success";
        res.status(200).send("5. Payment has been processed");
      } else {
        RedisStore[idempotencyKey] = "failed";
        res.status(500).send("6. Payment has not been processed");
      }
    }
  } catch (err) {
    RedisStore[idempotencyKey] = "failed";
    res.status(500).send("7. Payment has not been processed");
  }
});
