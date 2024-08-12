const { Router } = require('express')
const os = require('os')
const { errorHandler } = require("./exceptions/ErrorHandler");

const productRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");
const userRoutes = require("./routes/user");

const routes = Router();

routes.use("/products", productRoutes);
routes.use("/orders", ordersRoutes);
routes.use('/user', userRoutes);

routes.get("/health", (req, res) => {
    const healthInfo = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: Date.now(),
        hostname: os.hostname(),
        platform: os.platform(),
        pid: process.pid,
        version: process.version,
        memory: process.memoryUsage(),
    };
    res.send(healthInfo);
});

routes.use((err, req, res) => {
    errorHandler.handleError(err, res);
});

module.exports = routes;