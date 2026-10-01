const router = require('express').Router();

router.get('/', (req, res) => {
    res.send('Hello World');
});

router.use("/products", require("./products"));
router.use("/users", require("./users"));
router.use("/sales", require("./sales"));
router.use("/clients", require("./clients"));

module.exports = router;