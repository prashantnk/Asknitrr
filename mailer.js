const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const app = express();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const RefreshToken = process.env.REFRESH_TOKEN;
const oauthClient = new google.auth.OAuth2(clientId , clientSecret , redirectUri);
const user = process.env.USERMAILER;
oauthClient.setCredentials({refresh_token: RefreshToken});
function sendmail(accessToken , email , msg)
{
    const transporter = nodemailer.createTransport({
        service : "gmail",
        auth: {
            type: 'OAuth2',
            user : user,
            clientId: clientId,
            clientSecret: clientSecret,
            refreshToken : RefreshToken,
            accessToken : accessToken
        }
    });
    transporter.sendMail({
        from: "",
        to: email,
        subject: 'ASKNITRR',
        text: msg,
    });
}
exports.mail = (email , text )=>{
    oauthClient.getAccessToken().then((found)=>{
        sendmail(found.res.data.access_token , email , text);
    }).catch(error => { throw error});
};

