const express = require('express');
const seedrandom = require('seedrandom');
const router = express.Router();

const render = require("../utils/render.js");
const sendEmail = require("../utils/email_sender.js");
const conn = require("../db/connection.js");
const User = require("../db/user.js");
const { verifyLogin, withoutLogin } = require("../middlewares/login.js");

router.get("/entrar", withoutLogin, async (req, res) => {
    let view = "";

    let imports = render("base/static/css-import", {
        link: "/static/css/pages/login"
    });

    view = render("base/page", {
        title: "/ Entrar",
        imports: imports,
        header: render("login/base/header"),
        content: render("login/index", { alert: "" }),
        footer: render("base/footer")
    });

    res.end(view);
});

router.post("/entrar", withoutLogin, async (req, res) => {
    let view = "";

    let user = await User.verifyLogin(req.body);

    if (user !== null) {
        req.session.userId = user.id;
        res.redirect(301, "/usuario");
    }

    else {
        let message = "Email ou senha incorretos";

        let imports = render("base/static/css-import", {
            link: "/static/css/pages/login"
        });

        view = render("base/page", {
            title: "/ Entrar",
            imports: imports,
            header: render("login/base/header"),
            content: render("login/index", { alert: message }),
            footer: render("base/footer")
        });

        res.end(view);
    }
});

router.get("/cadastrar", withoutLogin, async (req, res) => {
    let view = "";

    let imports = render("base/static/css-import", {
        link: "/static/css/pages/login"
    });

    view = render("base/page", {
        title: "/ Cadastrar",
        imports: imports,
        header: render("login/base/header"),
        content: render("login/signup", { alert: "" }),
        footer: render("base/footer")
    });

    res.end(view);
});

router.post("/cadastrar", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", {code: 500, message: "error getting the token"});

    else
    {
        const user = new User(-1, req.body.name, req.body.email, req.body.password);

        if (await user.cadastrar(token)) {
            req.session.userId = user.id;
            res.redirect(301, "/usuario");
        }

        else {
            view = render("base/page", {
                title: "/ Cadastrar",
                imports: imports,
                header: render("login/base/header"),
                content: render("login/signup", { alert: "Ocorreu um erro ao cadastrar o usuário" }),
                footer: render("base/footer")
            });
        }
    }

    res.end(view);
});

router.get("/sair", verifyLogin, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    req.session.destroy((err) => {
        if(err) {
            console.log(err);
        } else {
            res.redirect(301, "/"); 
        }
    });
});

router.get("/recuperar-senha", withoutLogin, (req, res) => {
    let view = "";

    let imports = render("base/static/css-import", {
        link: "/static/css/pages/login"
    });

    view = render("base/page", {
        title: "/ Recuperar senha",
        imports: imports,
        header: render("login/base/header"),
        content: render("login/recover-password/email-input", { alert: "" }),
        footer: render("base/footer")
    });

    res.end(view);
});

router.post("/recuperar-senha", withoutLogin, async (req, res) => {
    let view = "";
    let imports = "";

    if (req.body.action) {
        switch (req.body.action) {
            case "sendcode":
                const generator = seedrandom(process.env.SECRET + "-" + req.body.email + "-" + Math.floor(Date.now() / 1000));
                let start = 100000;
                let end = 999999;
                let code = Math.floor(generator() * (end - start + 1)) + start;

                req.session.reset_code = code;
                console.log(code);

                /*if (!sendEmail(req.body.email, code)) {
                    imports = render("base/static/css-import", {
                        link: "/static/css/pages/login"
                    });
    
                    view = render("base/page", {
                        title: "/ Recuperar senha",
                        imports: imports,
                        header: render("login/base/header"),
                        content: render("login/recover-password/email-input"),
                        footer: render("base/footer")
                    });

                    break;
                }*/

                imports = render("base/static/css-import", {
                    link: "/static/css/pages/login"
                });

                view = render("base/page", {
                    title: "/ Recuperar senha",
                    imports: imports,
                    header: render("login/base/header"),
                    content: render("login/recover-password/code-input", { alert: "", email: req.body.email }),
                    footer: render("base/footer")
                });

                break;

            case "validatecode":
                imports = render("base/static/css-import", {
                    link: "/static/css/pages/login"
                });

                if (req.body.code == req.session.reset_code) {
                    req.session.reset_code = null;

                    view = render("base/page", {
                        title: "/ Recuperar senha",
                        imports: imports,
                        header: render("login/base/header"),
                        content: render("login/recover-password/password-input", { email: req.body.email }),
                        footer: render("base/footer")
                    });
                }

                else {
                    imports = render("base/static/css-import", {
                        link: "/static/css/pages/login"
                    });

                    view = render("base/page", {
                        title: "/ Recuperar senha",
                        imports: imports,
                        header: render("login/base/header"),
                        content: render("login/recover-password/code-input", { alert: "O código informado é inválido", email: req.body.email }),
                        footer: render("base/footer")
                    });
                }

                break;

            case "resetpassword":
                const token = await conn.getLoginToken();

                if (token === null) view = render("error/servererror", {code: 500, message: "error getting the token"});

                else {
                    const user = await User.getUserByEmail(req.body.email, token);

                    if (user === null) {
                        imports = render("base/static/css-import", {
                            link: "/static/css/pages/login"
                        });
        
                        view = render("base/page", {
                            title: "/ Recuperar senha",
                            imports: imports,
                            header: render("login/base/header"),
                            content: render("login/recover-password/email-input", { alert: "O email informado não está cadastrado no sistema!" }),
                            footer: render("base/footer")
                        });

                        break;
                    }

                    user.senha = req.body.password;

                    if (!user.atualizar(token)) {
                        view = render("error/servererror", {code: 500, message: "error updating the password"});
                        break;
                    }

                    req.session.userId = user.id;
                    res.redirect(301, "/usuario");
                }

                break;

            default:
                imports = render("base/static/css-import", {
                    link: "/static/css/pages/login"
                });

                view = render("base/page", {
                    title: "/ Recuperar senha",
                    imports: imports,
                    header: render("login/base/header"),
                    content: render("login/recover-password/email-input", { alert: "" }),
                    footer: render("base/footer")
                });

                break;
        }
    }

    else {
        imports = render("base/static/css-import", {
            link: "/static/css/pages/login"
        });

        view = render("base/page", {
            title: "/ Recuperar senha",
            imports: imports,
            header: render("login/base/header"),
            content: render("login/recover-password/email-input"),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

module.exports = router;