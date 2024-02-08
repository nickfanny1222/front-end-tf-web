const express = require("express");
const router = express.Router();

const render = require("../utils/render.js");

router.get("*", (req, res) => {
    res.end(render("error/notfound", { code: 404, message: "page not found"}));
});

router.post("*", (req, res) => {
    res.end(render("error/notfound", { code: 404, message: "page not found"}));
});

module.exports = router;