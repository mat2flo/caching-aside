const express = require("express")
const app = express()
const axios = require("axios")
const redis = require("redis")
const Stripe = require("stripe")
const stripe = Stripe("sk_test_4eC39HqLyjWDarjtT1zdp7dc")

const redisPort = 6379
const clientRedis = redis.createClient({
  port: port,
  host: redis,
})

client.on("error", (err) => {
  console.log(err)
})

const payment = async (amount, order_id) => {
  const res = await stripe.charges.create({
    amount: amount,
    currency: "usd",
    source: "tok_visa",
    metadata: { order_id: order_id },
  })
  if (res.paid === true) return true
  else return false
}

app.put("/payment", async (req, res) => {
  const { order_id, amount, idempotency-key } = req.body
  try {
    clientRedis.get(idempotencyKey, async (err, resRedis) => {
      if (err) throw new Error(err)

      if (resRedis) {
        if (resRedis.message === "success") {
          res.status(200).send("Payment has already effected")
        } else {
          try {
            const resPayment = await payment(amount, order_id)
            if (resPayment) {
              clientRedis.set(idempotencyKey, "success")
              res.status(200).send("Payment has been processed")
            } else {
              res.status(500).send("Payment has not been processed")
            }
          } catch (err) {
            res.status(500).send("Payment has not been processed")
          }
        }
      } else {
        const resPayment = await payment(amount, order_id)
        if (resPayment) {
          clientRedis.set(idempotencyKey, "success")
          res.status(200).send("Payment has been processed")
        } else {
          res.status(500).send("Payment has not been processed")
        }
      }
    })
  } catch (err) {
    res.status(500).send("Payment has not been processed")
  }
})
