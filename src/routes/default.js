const express = require('express');
const router = express.Router();

const render = require('../utils/render.js');
const conn = require('../db/connection.js');
const User = require('../db/user.js');
const Contact = require('../db/contact.js');
const Hability = require('../db/hability.js');
const { withoutLogin } = require("../middlewares/login.js");

router.get("/", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null)
    {
        view = render("error/servererror", {code: 500, message: "error getting the API token"});
    }

    else
    {
        let users = [];

        (await User.getUsers(token)).forEach(item => {
            if (item.id != 1) users.push(item);
        });

        let params = {};

        if (users.length == 0) {
            params = {
                content: render("default/base/noitens")
            };
        }

        else {
            let cards = "";

            for (let i = 0; i < (users.length > 3 ? 3 : users.length); i++) {
                let contacts = "";

                (await Contact.getContactByUser(users[i].id)).forEach(item => {
                    contacts += render("default/home/contact", {
                        "image-path": Contact.imageEnum[item.nome],
                        "name": item.nome
                    });
                });

                cards += render("default/home/card", {
                    id: users[i].id,
                    name: users[i].nome,
                    contacts: contacts.length > 0 ? contacts : "<h4 style='text-align: center'>Esse candidato não possui contatos</h4>",
                    descricao: User.cursoEnum[users[i].curso] + " - " + User.estadoEnum[users[i].estado],
                    "image-path": users[i].profile_image == null ? "/static/images/default user.png" : users[i].profile_image
                });
            }

            cards = render("default/home/grid", {
                candidates: cards
            });

            params = {
                content: cards
            };
        }

        let imports = render("base/css-import", {
            link: "/static/css/pages/home"
        });

        view = render("base/page", {
            title: "",
            imports: imports,
            header: render("default/base/header"),
            content: render("default/home/index", params),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

router.get("/sobre", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null)
    {
        view = render("error/servererror", {code: 500, message: "error getting the API token"});
    }

    else
    {
        let imports = render("base/css-import", {
            link: "/static/css/pages/about"
        });

        view = render("base/page", {
            title: "/ Sobre",
            imports: imports,
            header: render("default/base/header"),
            content: render("default/about/index"),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

router.get("/faq", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null)
    {
        view = render("error/servererror", {code: 500, message: "error getting the API token"});
    }

    else
    {
        let imports = render("base/css-import", {
            link: "/static/css/pages/faq"
        });

        view = render("base/page", {
            title: "/ FAQ",
            imports: imports,
            header: render("default/base/header"),
            content: render("default/faq/index"),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

router.get("/candidatos", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null)
    {
        view = render("error/servererror", {code: 500, message: "error getting the API token"});
    }

    else
    {
        let users = [];

        (await User.getUsers(token)).forEach(item => {
            if (item.id != 1) users.push(item);
        });
        
        let candidates = [];

        for (let i = 0; i < users.length; i++) {
            let contacts = await Contact.getContactByUser(users[i].id);
            let contact = [];
            
            contacts.forEach(element => {
                contact.push(element.nome);
            });
            
            candidates.push({
                id: users[i].id,
                nome: users[i].nome,
                profile_image: users[i].profile_image,
                curso: User.cursoEnum[users[i].curso],
                estado: User.estadoEnum[users[i].estado],
                contatos: contact
            });
        };

        let candidate = "";

        candidates.forEach(item => {
            let keys = Object.keys(item);
            let values = Object.values(item);

            candidate += "{";

            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == "contatos")
                {
                    candidate += keys[i] + ": [";

                    values[i].forEach(element => {
                        candidate += "'" + element + "', ";
                    });

                    candidate = candidate.substring(0, candidate.length - (values[i].length > 0 ? 2 : 0)) + "], ";
                    continue;
                }
                candidate += keys[i] + ": '" + values[i] + "', ";
            }

            candidate = candidate.substring(0, candidate.length - 2) + "} ,";
        });

        if (candidate.length > 0) candidate = candidate.substring(0, candidate.length - 2);
        
        let params = {
            candidates: candidate,
            "no-itens": render("default/candidates/no-itens")
        };

        let imports = render("base/css-import", { link: "/static/css/pages/candidates" }) + render("base/css-import", { link: "/static/css/component/modal" });

        view = render("base/page", {
            title: "",
            imports: imports,
            header: render("default/base/header"),
            content: render("default/candidates/index", params),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

router.get("/candidatos/:id", withoutLogin, async (req, res) => {
    let view = "";

    let token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", {code: 500, message: "error getting the API token"});

    else
    {
        let user = await User.getUserById(req.params.id, token);

        if (user === null) view = render("error/notfound", {code: 404, message: "error searching for the user " + req.params.id});

        else {
            let contacts = "";

            (await Contact.getContactByUser(token, user.id)).forEach(item => {
                contacts += render("default/candidates/contact", {
                    "link": item.link,
                    "nome": item.nome
                });
            });

            let habilitys = "";

            (await Hability.getHabilityByUser(token, user.id)).forEach(item => {
                habilitys += "{ titulo: '" + item.titulo + "', descricao: '" + item.descricao + "'}, ";
            });

            habilitys = habilitys.substring(0, habilitys.length - (habilitys.length > 0 ? 2 : 0));
    
            params = {
                profile_image: user.profile_image == null ? "/static/images/default user.png" : user.profile_image,
                nome_completo: user.nome_completo,
                email: user.email,
                telefone: user.telefone,
                curso: User.cursoEnum[user.curso],
                estado: User.estadoEnum[user.estado],
                contacts: contacts.length > 0 ? contacts : "<h4 style='text-align: center'>Esse candidato não possui contatos</h4>",
                hability: habilitys
            };
    
            let imports = render("base/css-import", {
                link: "/static/css/pages/candidate"
            });
    
            view = render("base/page", {
                title: "",
                imports: imports,
                header: render("default/base/header"),
                content: render("default/candidates/candidate", params),
                footer: render("base/footer")
            });
        }
    }

    res.end(view);
});

module.exports = router;