const conn = require('./connection.js');

/**
 * Representante da tabela usuario
 */
class User {
    /**
     * Construtor da classe
     * @param {Number} id ID da entidade no banco de dados
     * @param {String} nome Nome do usuário
     * @param {String} email Email do usuário
     * @param {String} senha Senha de acesso do usuário
     * @param {String} nome_completo Nome completo do usuário
     * @param {Number} curso Curso do usuário
     * @param {Number} estado Estado do usuário na instituição
     * @param {String} telefone Telefone do usuário
     * @param {Boolean} ativo Estado do usuário no sistema
     * @param {String} profile_image Caminho da imagem de perfil do usuário
     */
    constructor(id = -1, nome = "", email = "", senha = "", nome_completo = "", curso = 0, estado = 0, telefone = "", ativo = false, profile_image = null) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.nome_completo = nome_completo;
        this.curso = curso;
        this.estado = estado;
        this.telefone = telefone;
        this.ativo = ativo;
        this.profile_image = profile_image;
    }

    static cursoEnum = [
        "Agroindústria",
        "Agropecuária",
        "Informática"
    ];

    static estadoEnum = [
        "Matriculado",
        "Cursando",
        "Trancado",
        "Concluído",
        "Desistente"
    ];

    toString() {
        let str = "[id] => " + this.id;
        str += "\n[nome] => " + this.nome;
        str += "\n[email] => " + this.email;
        str += "\n[senha] => " + this.senha;
        str += "\n[nome_completo] => " + this.nome_completo;
        str += "\n[curso] => " + this.cursoEnum[this.curso];
        str += "\n[estado] => " + this.estadoEnum[this.estado];
        str += "\n[telefone] => " + this.telefone;
        str += "\n[ativo] => " + this.ativo;
        str += "\n[profile_image] => " + this.profile_image;
        return str;
    }
    
    /**
     * Retorna um usuário com base no seu ID
     * @param {Number} id ID do usuário a ser retornado
     * @param {String} token Token de login da API
     * @returns {User | null} Objeto do tipo Usuário ou null em caso de erro
     */
    static async getUserById(id, token) {
        return conn.makeRequest(process.env.API_URL, "/user/" + id, "GET", {}, { token: token })
        .then(data => {
            let res = JSON.parse(data);

            if (res.message) return null;
            
            return User.createSelfInstance(res);
        })
        .catch(error => {
            return null;
        })
    }

    /**
     * Retorna um usuário com base no seu email
     * @param {String} email Email do usuário a ser procurado
     * @param {String} token Token de login da API
     * @returns {User | null} Objeto do tipo User ou null em caso de erro
     */
    static async getUserByEmail(email, token) {
        const users = await this.getUsers(token);

        for (let i = 0; i < users.length; i++) {
            if (users[i].email == email) return users[i];
        }

        return null;
    }

    /**
     * Retorna todos os usuários cadastrados
     * @param {String} token Token de login da API
     * @returns {User[]} Array de objetos do tipo User
     */
    static async getUsers(token) {
        return conn.makeRequest(process.env.API_URL, "/user", "GET", {}, { token: token })
        .then(data => {
            let array = JSON.parse(data);
            let res = [];

            array.forEach(item => {
                res.push(User.createSelfInstance(item));
            });

            return res;
        })
        .catch(error => {
            return [];
        })
    }
    
    /**
     * Verifica as credenciais de login de um usuário e retorna seus dados se elas estiverem corretas
     * @param {*} obj Parâmetros da requisição { email: "", senha: ""}
     * @returns {User | null} Objeto do tipo User ou null em caso de erro
     */
    static async verifyLogin(obj) {
        return conn.makeRequest(process.env.API_URL, "/user/login", "POST", { email: obj.email, senha: obj.password })
        .then(data => {
            let res = JSON.parse(data);
            if (res.message) return null;
            
            return User.createSelfInstance(res);
        })
        .catch(error => {
            return null;
        })
    }

    /**
     * Cadastra o usuário atual no banco de dados
     * @param {String} token Token de login da API
     * @returns {Boolean} Resultado da requisição
     */
    async cadastrar(token) {
        this.id = await conn.makeRequest(process.env.API_URL, "/user", "POST", {
            nome: this.nome,
            email: this.email,
            senha: this.senha,
            nome_completo: this.nome_completo,
            curso: this.curso,
            estado: this.estado,
            telefone: this.telefone,
            ativo: this.ativo,
            profile_image: this.profile_image
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
     * Atualiza os dados do usuário atual
     * @param {String} token Token de login da API
     * @returns {Boolean} Resultado da requisição
     */
    async atualizar(token) {
        const res = await conn.makeRequest(process.env.API_URL, "/user/" + this.id, "PUT", {
            nome: this.nome,
            email: this.email,
            senha: this.senha,
            nome_completo: this.nome_completo,
            curso: this.curso,
            estado: this.estado,
            telefone: this.telefone,
            ativo: this.ativo,
            profile_image: this.profile_image
        }, { token: token })
        .then(data => {
            return true;
        })
        .catch(error => {
            return false;
        });

        return res;
    }

    /**
     * Exclui a instância atual do banco de dados
     * @param {String} token 
     */
    async excluir(token) {
        let res = await conn.makeRequest(process.env.API_URL, "/user/" + this.id, "DELETE", {}, { token: token })
        .then(data => {
            return true;
        })
        .catch(error => {
            return false;
        });

        return res;
    }

    static createSelfInstance(jsonObj) {
        return new User(jsonObj.id, jsonObj.nome, jsonObj.email, jsonObj.senha, jsonObj.nome_completo, jsonObj.curso, jsonObj.estado, jsonObj.telefone, jsonObj.ativo, jsonObj.profile_image);
    }
}

module.exports = User;