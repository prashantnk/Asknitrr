const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const app = express();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const RefreshToken = process.env.REFRESH_TOKEN;
const user = process.env.USERMAILER;

const sendmail = async (accessToken, email, msg, subject) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: 'OAuth2',
            user: user,
            clientId: clientId,
            clientSecret: clientSecret,
            refreshToken: RefreshToken,
            accessToken: accessToken
        }
    });
    transporter.sendMail({
        from: "ASKNITRR",
        to: email,
        subject: subject + " <ASKNITRR> ",
        text: msg,
    });
}
exports.mail = (email, text, subject) => {
    const oauthClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauthClient.setCredentials({ refresh_token: RefreshToken });
    oauthClient.getAccessToken().then((found) => {
        sendmail(found.res.data.access_token, email, text, subject);
    }).catch(error => { throw error });
};

