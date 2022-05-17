# caching-aside

Start the project:

- **git clone https://github.com/mat2flo/caching-aside.git**
- go in the folder
- start your docker
- in the folder of app : **docker-compose up**

In a other terminal, you can emulate the client making a payment:

**curl -d '{"orderId":"123", "amount":"444", "idempotencyKey":"3HUFUEH324"}' -H "Content-Type: application/json" -X POST http://localhost:3000/payment**


orderId = id of the purchase
amount: value of the purchase
idempotencyKey: id unique of request
