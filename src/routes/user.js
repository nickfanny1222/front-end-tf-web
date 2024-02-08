const express = require('express');
const path = require('path');
const fs = require("fs");
const multer = require('multer');

const router = express.Router();
const storageEngine = multer.diskStorage({
    destination: '/tmp/src/public/images/user',
    filename: (req, file, cb) => {
        const extension = file.originalname.split(".")[1];
        cb(null, req.session.userId + "." + extension);
    },
});

const upload = multer({ storage: storageEngine });

const render = require("../utils/render.js");
const conn = require('../db/connection.js');
const User = require("../db/user.js");
const Contact = require("../db/contact.js");
const Hability = require("../db/hability.js");
const { verifyLogin } = require("../middlewares/login.js");
const userNotActive = require("../middlewares/user.js");

router.get("/", verifyLogin, async (req, res) => {
    let view = "";
    let imports = "";

    const token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", { code: 500, message: "error getting the API token" });

    else {
        const user = await User.getUserById(req.session.userId, token);

        if (user === null) view = render("error/servererror", { code: 500, message: "error recovering the data of the user " + req.session.userId });

        else {
            if (user.ativo) {
                imports = render("base/static/css-import", { link: "/static/css/pages/user" }) + render("base/static/css-import", { link: "/static/css/component/modal" });

                let contacts = "";

                const contatos = await Contact.getContactByUser(token, user.id);

                contatos.forEach(item => {
                    contacts += render("user/home/contact", {
                        "image-path": Contact.imageEnum[item.nome],
                        "name": item.nome
                    });
                });

                view = render("base/page", {
                    title: "/ Área do Candidato",
                    imports: imports,
                    header: render("user/base/header"),
                    content: render("user/home/index", {
                        nome: user.nome,
                        contacts: contacts.length > 0 ? contacts : "<h4 style='text-align: center'>Você não possui contatos</h4>",
                        descricao: User.cursoEnum[user.curso] + " - " + User.estadoEnum[user.estado],
                        "image-path": user.profile_image == null ? "/static/images/default user.png" : user.profile_image
                    }),
                    footer: render("base/footer")
                });
            }

            else {
                imports = render("base/static/css-import", { link: "/static/css/pages/no-curriculum" }) + render("base/static/css-import", { link: "/static/css/component/modal" });

                view = render("base/page", {
                    title: "/ Área do Candidato",
                    imports: imports,
                    header: render("user/base/header"),
                    content: render("user/home/no-curriculum"),
                    footer: render("base/footer")
                });
            }
        }
    }

    res.end(view);
});

// ROTA DE EXCLUSÃO DE CONTA
router.post("/", verifyLogin, async (req, res) => {
    let view = "";

    const token = await conn.getLoginToken();

    if (token === null) {
        view = render("error/servererror", { code: 500, message: "Error getting the API token"});
    }

    else {
        if (req.body.action === "delete") {
            const user = await User.getUserById(req.session.userId, token);

            if (user === null) view = render("error/notfound", { code: 404, message: "Error searching for the user " + req.session.userId });

            else {
                if (await user.excluir(token)) {
                    res.redirect(301, "/");
                    return;
                }
                
                view = render("error/servererror", { code: 500, message: "Error deleting the user " + req.session.userId });
            }
        }

        else {
            view = render("error/servererror", { code: 500, message: "Missing the POST token"})
        }
    }

    res.end(view);
});

router.get("/curriculo", verifyLogin, async (req, res) => {
    let view = "";

    const token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", {code: 500, message: "error getting the API token"});

    else
    {
        const user = await User.getUserById(req.session.userId, token);

        if (user === null) view = render("error/notfound", {code: 404, message: "error searching for the user " + req.session.userId});

        else {
            if (!user.ativo) {
                view = render("base/page", {
                    title: "/ Área do Candidato",
                    imports: render("base/static/css-import", {
                        link: "/static/css/pages/no-curriculum"
                    }),
                    header: render("user/base/header"),
                    content: render("user/curriculum/no-curriculum"),
                    footer: render("base/footer")
                });
            }

            else {
                let contacts = "";

                (await Contact.getContactByUser(token, user.id)).forEach(item => {
                    contacts += render("user/curriculum/contact", {
                        "link": Contact.defaultLink[item.nome.toLocaleLowerCase()] + item.link,
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
                    contacts: contacts.length > 0 ? contacts : "<h4 style='text-align: center'>Você não possui contatos</h4>",
                    hability: habilitys
                };
        
                let imports = render("base/static/css-import", {
                    link: "/static/css/pages/candidate"
                });
        
                view = render("base/page", {
                    title: "",
                    imports: imports,
                    header: render("user/base/header"),
                    content: render("user/curriculum/index", params),
                    footer: render("base/footer")
                });
            }
        }
    }

    res.end(view);
});

router.get("/curriculo/novo", verifyLogin, userNotActive, (req, res) => {
    let view = "";
    let imports = render("base/static/css-import", { link: "/static/css/pages/candidate" }) + render("base/static/css-import", { link: "/static/css/pages/contact" });

    view = render("base/page", {
        title: "/ Área do candidato / Meu currículo",
        imports: imports,
        header: render("user/base/header"),
        content: render("user/curriculum/new"),
        footer: render("base/footer")
    });

    res.end(view);
});

router.post("/curriculo/novo", verifyLogin, upload.single("image"), async (req, res) => {
    const token = await conn.getLoginToken();

    if (token === null) {
        fs.unlinkSync(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });

        res.end(render("servererror", { code: 500, message: "error getting the API login token" }));
        return;
    }

    const user = await User.getUserById(req.session.userId, token);

    if (user === null) {
        fs.unlinkSync(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });

        res.end(render("notfound", { code: 404, message: "error searching for the user " + req.session.userId }));
        return;
    }

    user.profile_image = ("/static/images/user/" + req.file.filename) || null;
    user.nome_completo = req.body.nome;
    user.telefone = req.body.telefone;
    user.curso = req.body.curso;
    user.estado = req.body.estado;
    user.ativo = true;

    let contacts = [];

    if (req.body.facebook.length > 0) {
        contacts.push(new Contact(undefined, user.id, "facebook", Contact.defaultLink["facebook"] + "/" + req.body.facebook));
    }
    
    if (req.body.twitter.length > 0) {
        contacts.push(new Contact(undefined, user.id, "twitter", Contact.defaultLink["twitter"] + "/" + req.body.facebook));
    }
    
    if (req.body.instagram.length > 0) {
        contacts.push(new Contact(undefined, user.id, "instagram", Contact.defaultLink["instagram"] + "/" + req.body.facebook));
    }

    for (let i = 0; i < contacts.length; i++) {
        await contacts[i].cadastrar(token);
    }

    if (await user.atualizar(token)) {
        res.redirect(301, "/usuario/curriculo");
    }

    else {
        fs.unlinkSync(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });

        res.end(render("servererror", { code: 500, message: "error updating the user data" }));
    }
});

router.get("/curriculo/editar", verifyLogin, async (req, res) => {
    let view = "";
    const token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", { code: 500, message: "error getting the API login token" });

    else {
        const user = await User.getUserById(req.session.userId, token);

        if (user === null) view = render("error/servererror", { code: 500, message: "error recovering the data of the user " + req.session.userId });

        else {
            let params = {
                image: user.profile_image,
                nome: user.nome_completo,
                email: user.email,
                telefone: user.telefone
            };

            for (let i = 0; i < 3; i++) {
                params["selected-course-" + i] = i === user.curso ? "selected" : "";
            }

            for (let i = 0; i < 5; i++) {
                params["selected-state-" + i] = i === user.estado ? "selected" : "";
            }

            view = render("base/page", {
                title: "/ Área do Candidato / Editar",
                imports: render("base/static/css-import", {
                    link: "/static/css/pages/candidate"
                }),
                header: render("user/base/header"),
                content: render("user/curriculum/edit", params),
                footer: render("base/footer")
            });
        }
    }

    res.end(view);
});

router.post("/curriculo/editar", verifyLogin, upload.single("image"), async (req, res) => {
    let view = "";
    const token = await conn.getLoginToken();
    
    if (token === null) view = render("error/servererror", { code: 500, message: "error getting the login API token" });

    else {
        const user = await User.getUserById(req.session.userId, token);

        if (user === null) view = render("error/notfound", { code: 404, message: "error recovering the data of the user " + req.session.userId });

        else {
            if (req.body.action !== "edit") {
                let params = {
                    image: user.profile_image,
                    nome: user.nome_completo,
                    email: user.email,
                    telefone: user.telefone
                };
    
                for (let i = 0; i < 3; i++) {
                    params["selected-course-" + i] = i === user.curso ? "selected" : "";
                }
    
                for (let i = 0; i < 5; i++) {
                    params["selected-state-" + i] = i === user.estado ? "selected" : "";
                }
    
                view = render("base/page", {
                    title: "/ Área do Candidato / Editar",
                    imports: render("base/static/css-import", {
                        link: "/static/css/pages/candidate"
                    }),
                    header: render("user/base/header"),
                    content: render("user/curriculum/edit", params),
                    footer: render("base/footer")
                });
            }

            else {
                user.nome = req.body.nome.split(" ")[0] || user.nome;
                user.nome_completo = req.body.nome || user.nome_completo;
                user.email = req.body.email || user.email;
                user.telefone = req.body.telefone || user.telefone;
                user.curso = req.body.curso || user.curso;
                user.estado = req.body.estado || user.estado;

                try {
                    user.profile_image = "/static/images/user/" + req.file.filename;
                }

                catch { }

                if (!user.atualizar(token)) {
                    view = render("error/servererror", { code: 500, message: "error updating the user " + req.session.userId });
                }

                else {
                    res.redirect(301, "/usuario/curriculo");
                    return;
                }
            }
        }
    }

    res.end(view);    
});

router.get("/curriculo/habilidades", verifyLogin, async (req, res) => {
    let view = "";
    const token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", { code: 500, message: "error getting the API login token" });

    else {
        const hability = await Hability.getHabilityByUser(token, req.session.userId);

        let habilitys = "";

        hability.forEach(item => {
            habilitys += "{id: " + item.id + ", titulo: '" + item.titulo + "', descricao: '" + item.descricao + "'}, ";
        });

        habilitys = habilitys.length > 0 ? habilitys.substring(0, habilitys.length - 2) : habilitys;

        view = render("base/page", {
            title: "/ Área do candidato / Habilidades",
            imports: render("base/static/css-import", { link: "/static/css/pages/hability" }) + render("base/static/css-import", { link: "/static/css/component/table" }) + render("base/static/css-import", { link: "/static/css/component/modal" }),
            header: render("user/base/header"),
            content: render("user/hability/index", { hability: habilitys }),
            footer: render("base/footer")
        });
    }

    res.end(view);
});

router.post("/curriculo/habilidades", verifyLogin, async (req, res) => {
    if (!req.body.acao) {
        res.redirect(301, "/usuario/curriculo/habilidades");
        return;    
    }

    const token = await conn.getLoginToken();

    if (token === null) {
        res.end(render("error/servererror", { code: 500, message: "error getting the login API token" }));
        return;
    }

    let hability;

    switch (req.body.acao) {
        case "editar":
            hability = new Hability(req.body.id, req.session.userId, req.body.titulo, req.body.descricao);

            if (!await hability.atualizar(token)) {
                res.end("error/servererror", { code: 500, message: "error updating the data" });
                return;
            }

            break;

        case "excluir":
            hability = new Hability(req.body.id, req.session.userId, null, null);

            if (!await hability.excluir(token)) {
                res.end("error/servererror", { code: 500, message: "error deleting the data" });
                return;
            }

            break;

        case "cadastrar":
            hability = new Hability(undefined, req.session.userId, req.body.titulo, req.body.descricao);
            
            if (!await hability.cadastrar(token)) {
                res.end("error/servererror", { code: 500, message: "error inserting the data" });
                return;
            }

            break;
    }

    res.redirect(301, "/usuario/curriculo/habilidades");
});

router.get("/curriculo/contatos", verifyLogin, async (req, res) => {
    let view = "";
    const token = await conn.getLoginToken();

    if (token === null) view = render("error/servererror", { code: 500, message: "error getting the API login token" });

    else {
        const contact = await Contact.getContactByUser(token, req.session.userId);
        const contacts = {
            facebook: "",
            instagram: "",
            twitter: ""
        };

        contact.forEach(item => {
            contacts[item.nome.toLowerCase()] = item.link;
        });

        view = render("base/page", {
            title: "/ Área do candidato / Contatos",
            imports: render("base/static/css-import", { link: "/static/css/pages/contact" }),
            header: render("user/base/header"),
            content: render("user/contact/index", {
                facebook: contacts["facebook"],
                instagram: contacts["instagram"],
                twitter: contacts["twitter"]
            }),
            footer: render("base/footer")
        })
    }

    res.end(view);
}); 

router.post("/curriculo/contatos", verifyLogin, async (req, res) => {
    const token = await conn.getLoginToken();

    if (token === null) res.end(render("error/servererror", { code: 500, message: "error getting the API login token" }));

    else {
        if (req.body.acao) {
            let contacts = [];

            if (req.body.facebook) contacts.push(new Contact(undefined, req.session.userId, "Facebook", req.body.facebook));
            if (req.body.instagram) contacts.push(new Contact(undefined, req.session.userId, "Instagram", req.body.instagram));
            if (req.body.twitter) contacts.push(new Contact(undefined, req.session.userId, "Twitter", req.body.twitter));

            const contact = await Contact.getContactByUser(token, req.session.userId);

            for (let i = 0; i < contact.length; i++) {
                await contact[i].excluir(token);
            }

            for (let i = 0; i < contacts.length; i++) {
                await contact[i].cadastrar(token);
            }
        }
        
        res.redirect(301, "/usuario/curriculo/contatos");
    }
});

module.exports = router;