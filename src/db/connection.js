const http = require('follow-redirects').http;

/**
 * Realiza requisições HTTP
 * @param {String} url URL do servidor a ser requisitado
 * @param {String} path URI da rota a ser requisitada
 * @param {String} method Método HTTP da requisição
 * @param {Object} body Corpo da requisição { key: value }
 * @param {Object} header Cabeçalho da requisição { key: value }
 * @return {Promise} O resultado da requisição
 */
function makeRequest(url, path, method = "GET", body = {}, header = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);

        const options = {
            host: url,
            path: path,
            method: method,
            headers: header
        }

        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);

        const req = http.request(options, (req) => {
            let body = "";

            req.on('data', (chunck) => {
                body += chunck;
            });

            req.on('end', () => {
                resolve(body);
            })
        });
        
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

/**
 * Retorna um token de acesso a API
 * @returns {Promise} O token de login ou null em caso de erro
 */
async function getLoginToken() {
    return makeRequest(process.env.API_URL, "/login", "POST", {
        email: process.env.API_USER,
        senha: process.env.API_PASSWORD
    }, {})
    .then(body => {
        let token = JSON.parse(body).token;
        return token;
    })
    .catch(err => {
        console.error(err);
        return null;
    });
}

module.exports = { makeRequest, getLoginToken };