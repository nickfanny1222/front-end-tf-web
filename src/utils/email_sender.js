/**
 * Realiza o envio de emails de recuperação de senha
 * @param {String} receiver Email do destinatário
 * @param {Number} code Código de recuperação de senha
 */
async function sendEmail(receiver, code) {
    const Mailjet = require('node-mailjet');
    const conn = Mailjet.apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_API_SECRET);

    const request = conn
    .post("send", {'version': 'v3.1'})
    .request({
        "Messages":[
            {
            "From": {
                "Email": process.env.SYSTEM_EMAIL,
                "Name": "Conexão Carreira"
            },
            "To": [
                {
                "Email": receiver,
                "Name": "You"
                }
            ],
            "Subject": "Recuperar Senha",
            "TextPart": "Seu código de recuperação de senha é: " + code + "\nEsse código é único e não deve ser compartilhado.\n\nApp Conexão Carreira",
            "HTMLPart": "<p>Seu código de recuperação de senha é: <b>" + code + "</b></p><br><p>Esse código é único e não deve ser compartilhado.</p><br><small>App Conexão Carreira</small>",
            "CustomID": "conexao-carreira-email"
            }
        ]
    });

    return await request.then((result) => {
        return true;
    }).catch((err) => {
        return false;
    });
}

module.exports = sendEmail;