const { google } = require("googleapis");
const {GoogleAuth} = require('google-auth-library');

module.exports = function(RED) {
    const register = function (config) {
        RED.nodes.createNode(this, config);
        let node   = this;

        node.name  = config.name;
        node.scope = config.scope;
        node.actAs = config.actAs;
        node.authenticate = (callback) => { auth(node, RED, config, callback); };

        node.cred = (config.way === "json" && node.credentials.json) ? JSON.parse(node.credentials.json) : {};
        if (!node.cred.project_id && node.credentials.projectId)        node.cred.project_id = node.credentials.projectId;
        if (!node.cred.client_email && node.credentials.client_email)   node.cred.client_email = node.credentials.client_email;
        if (!node.cred.private_key && node.credentials.private_key)     node.cred.private_key = node.credentials.private_key.replace(/\\n/g,'\n');
        
        delete node.credentials;
    };

    RED.nodes.registerType("google-service-account", register, {
        credentials: {    
            projectId:    { type: "text" },
			client_email: { type: "text" },
            private_key:  { type: "text" },
            json:         { type: "text" },
            actAs:         { type: "text" },
    	}
    });
}

const auth = (node, RED, config, callback) => {

    authenticate(node.cred, node.scope, node.actAs, (err, client, token) => {
        if (err) return node.warn(err);
        node.client = client;
        node.token  = token;
        callback(client, token);
    })
}

const authenticate = async (json, scope, subject, callback) => {

    let client = google.auth;
    console.log(subject);
    let jwt    = new client.JWT(json.client_email, null, json.private_key, scope, subject);
    
    renewJWTAuth(jwt , callback);
}

const renewJWTAuth = (jwt, callback) => {
    
    jwt.authorize(function(err, token){
      if (err) return callback(err);
      let auth = { 
          type: token.token_type, 
          value: token.access_token, 
          expires: token.expiry_date 
      }
      callback(undefined, jwt, auth)
    });
}