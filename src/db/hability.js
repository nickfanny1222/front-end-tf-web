const conn = require('./connection.js');

/**
 * Representante da tabela habilidade
 */
class Hability {
    /**
     * Construtor da classe
     * @param {Number} id ID da entidade no banco de dados
     * @param {Number} usuario ID do usuário dono da habilidade
     * @param {String} titulo Título da habilidade
     * @param {String} descricao Descrção da habilidade
     */
    constructor(id = -1, usuario, titulo, descricao) {
        this.id = id;
        this.usuario = usuario;
        this.titulo = titulo;
        this.descricao = descricao;
    }

    toString() {
        let str = "[id] => " + this.id;
        str += "\n[usuario] => " + this.usuario;
        str += "\n[titulo] => " + this.titulo;
        str += "\n[descricao] => " + this.descricao;
        return str;
    }

    /**
     * Retorna todas as habilidades de um usuário
     * @param {String} token Token de login da API
     * @param {Number} id ID do usuário dono da habilidade
     * @returns {Hability[]} Array de objetos do tipo Hability
     */
    static async getHabilityByUser(token, id) {
        return conn.makeRequest(process.env.API_URL, "/user/" + id + "/hability", "GET", {}, { token: token })
        .then(data => {
            let array = JSON.parse(data);
            let res = [];

            array.forEach(item => {
                res.push(Hability.createSelfInstance(item));
            });

            return res;
        })
        .catch(error => {
            return [];
        })
    }

    /**
     * Cadastra a habilidade atual no banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean}
     */
    async cadastrar(token) {
        this.id = await conn.makeRequest(process.env.API_URL, "/hability", "POST", {
            usuario: this.usuario,
            titulo: this.titulo,
            descricao: this.descricao
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
     * Atualiza a habilidade atual no banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean}
     */
    async atualizar(token) {
        return await conn.makeRequest(process.env.API_URL, "/hability/" + this.id, "PUT", {
            usuario: this.usuario,
            titulo: this.titulo,
            descricao: this.descricao
        }, { token: token })
        .then(data => {
            return true;
        })
        .catch(error => {
            return false;
        });
    }

    /**
     * Exclui a habilidade atual do banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean}
     */
    async excluir(token) {
        return await conn.makeRequest(process.env.API_URL, "/hability/" + this.id, "DELETE", { }, { token: token })
        .then(data => { return true; })
        .catch(error => { return false; })
    }

    /**
     * Inicializa uma instância de Hability a partir de um objeto JSON
     * @param {*} jsonObj Representação em formato JSON do objeto Hability
     * @returns {Hability}
     */
    static createSelfInstance(jsonObj) {
        return new Hability(jsonObj.id, jsonObj.usuario, jsonObj.titulo, jsonObj.descricao);
    }
}

module.exports = Hability;