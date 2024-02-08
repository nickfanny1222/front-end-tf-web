function verifyLogin(req, res, next) {
    if (req.session.userId) next();
    else res.redirect(301, "/");
}

function withoutLogin(req, res, next) {
    if (req.session.userId) res.redirect(301, "/usuario");
    else next();
}

module.exports = { verifyLogin, withoutLogin };