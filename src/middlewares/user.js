const conn = require("../db/connection.js");
const render = require("../utils/render.js");
const User = require("../db/user.js");

async function userNotActive(req, res, next) {
    const token = await conn.getLoginToken();

    if (token === null) {
        res.end(render("error/servererror", { code: 500, message: "error getting the API login token" }));
        return;
    }

    if ((await User.getUserById(req.session.userId, token)).ativo) {
        res.redirect(301, "/usuario/curriculo");
        return;
    }

    next();
}

module.exports = userNotActive;