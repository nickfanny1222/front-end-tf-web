function disable_cache(req, res, next) {
    res.setHeader('Cache-Control', 'no-store');
    next();
}

module.exports = disable_cache;