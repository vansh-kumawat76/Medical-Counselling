const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const verifyGoogleToken = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

 if (
  !payload ||
  !payload.email ||
  payload.email_verified !== true ||
  !payload.sub
) {
  throw new Error("Invalid or unverified Google account.");
}

  return payload;
};

module.exports = verifyGoogleToken;