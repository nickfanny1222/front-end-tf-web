const conn = require('./connection.js');

/**
 * Representante da tabela contato
 */
class Contact {
    /**
     * Construtor da classe
     * @param {Number} id ID da entidade no banco de dados
     * @param {Number} usuario ID do usuário dono do contato
     * @param {String} nome Nome da rede social do contato
     * @param {String} link Link do contato do usuário
     */
    constructor(id = -1, usuario, nome, link) {
        this.id = id;
        this.usuario = usuario;
        this.nome = nome;
        this.link = link;
    }

    static imageEnum = {
        facebook: "/static/images/facebook.png",
        twitter: "/static/images/twitter.png",
        instagram: "/static/images/instagram.png"
    };

    static defaultLink = {
        facebook: "https://facebook.com/",
        twitter: "https://twitter.com/",
        instagram: "https://instagram.com/"
    };

    toString() {
        let str = "[id] => " + this.id;
        str += "\n[usuario] => " + this.usuario;
        str += "\n[nome] => " + this.nome;
        str += "\n[link] => " + this.link;
        return str;
    }

    /**
     * Retorna todos os contatos de um usuário
     * @param {String} token Token de login da API
     * @param {Number} id ID do usuário dono do contato
     * @returns {Contact[]} Array de objetos do tipo Contact
     */
    static async getContactByUser(token, id) {
        return conn.makeRequest(process.env.API_URL, "/user/" + id + "/contact", "GET", {}, { token: token })
        .then(data => {
            let array = JSON.parse(data);
            let res = [];

            array.forEach(item => {
                res.push(Contact.createSelfInstance(item));
            });

            return res;
        })
        .catch(error => {
            return [];
        })
    }

    /**
     * Cadastra o contato atual no banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean}
     */
    async cadastrar(token) {
        this.id = await conn.makeRequest(process.env.API_URL, "/contact", "POST", {
            usuario: this.usuario,
            nome: this.nome,
            link: this.link
        }, { token: token })
        .then(data => {
            return JSON.parse(data).id;
        })
        .catch(error => {
            return -1;
        });

        return this.id != -1;
    }

    /**
     * Exclui o contato atual do banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean}
     */
    async excluir(token) {
        return await conn.makeRequest(process.env.API_URL, "/contact/" + this.id, "DELETE", { }, { token: token })
        .then(data => { return true; })
        .catch(error => { return false; })
    }

    /**
     * Inicializa uma instância de Contact a partir de um objeto JSON
     * @param {*} jsonObj Representação em formato JSON do objeto Contact
     * @returns {Contact}
     */
    static createSelfInstance(jsonObj) {
        return new Contact(jsonObj.id, jsonObj.usuario, jsonObj.nome, jsonObj.link);
    }
}

module.exports = Contact;