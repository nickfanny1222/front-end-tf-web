const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieSession = require('cookie-session');

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

const defaultRouter = require('./routes/default.js');
const loginRouter = require('./routes/login.js');
const userRouter = require('./routes/user.js');
const errorRouter = require('./routes/error.js');

const disable_cache = require("./middlewares/disable_cache.js");

app.use(express.static('static/src/public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'sessão',
    keys: ['chave 01', 'chave 02'],
    maxAge:  4 *  60 *  60 *  1000
}));

app.use(disable_cache);

app.use("/", loginRouter);
app.use("/", defaultRouter);
app.use("/usuario", userRouter);
app.use("*", errorRouter);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
