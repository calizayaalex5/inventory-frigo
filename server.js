const express = require("express");

const mongodb = require("./mongoConnect");
const app = express();

const bodyParser = require("body-parser");

const port = process.env.PORT || 3000;

app.use(bodyParser.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requester-With, Content-Type, Accept, Z-Key'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({ extended: true}))

app.use("/", require("./routes"))

mongodb.initDb((err) => {
    if(err) {
        console.log(err);
    }
    else {
        app.listen(port, () => {console.log(`Database is listen and node running on port ${port}`)})
    }
})