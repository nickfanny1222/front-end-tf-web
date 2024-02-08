const fs = require("fs");
const path = require("path");

/**
 * Retorna uma view renderizada
 * @param {String} view View a ser renderizada
 * @param {Object} params Parâmetros da view {key: value}
 */
function render(view, params = {}) {
    let keys = Object.keys(params);
    let values = Object.values(params);
    
    keys.push("URL");
    values.push(process.env.URL);

    let file = fs.readFileSync(path.join(__dirname + "/../views/" + view + ".html")).toString();

    keys = keys.map(item => {
        return "@{" + item + "}@";
    });

    for (let i = 0; i < keys.length; i++) {
        let regex = new RegExp(keys[i], 'g');
        file = file.replace(regex, values[i]);
    }

    return file;
}

module.exports = render;