import { Elysia } from "elysia";
import axios from "axios";
import qs from "qs";
import { requireRole } from "../hooks/requireRole";

const LINE_CHANNEL_ACCESS_TOKEN =
  "LO2jgxe/E7j3yqymxnKheGNvuG503tjnUR9Twkq+DUcEls/UrFgRexkq/79b/1U9wurDdiZvPvAm2fFmpnJ8gKxVvexldXqIfCMXQYp62nJggytqlSzot30oVix5mJSuA3v5ITo9VwAlEo3nzNj6iwdB04t89/1O/w1cDnyilFU=";

const CLIENT_ID = process.env.LINE_CHANNEL_ID || "2008071362-Eqg9y1Qa";
const CLIENT_SECRET = "76c589c0a53b923bef9b8a35bc25cea6";
const REDIRECT_URI = "http://localhost/api/callback"; // URL registered with the provider, e.g., http://localhost:3000/callback

/**
 * The test routes.
 * Accessible by: admin (เจ้าของโครงการ), staff (นิติ), superadmin (เจ้าของ SE)
 * @type {Elysia}
 */
export const tests = new Elysia({ prefix: "/api" })
  .onBeforeHandle(requireRole(["admin", "staff", "superadmin"]))
  /**
   * Callback for LINE login.
   * @param {Object} context - The context for the request.
   * @param {Object} context.query - The query parameters.
   * @param {Object} context.set - The set object.
   * @returns {Promise<string>} A promise that resolves to a success or failure message.
   */
  .get("/callback", async ({ query, set }) => {
    const code = query.code;

    if (!code) {
      set.status = 400;
      return "Missing code parameter";
    }

    try {
      // 1. Request access_token
      const tokenRes = await axios.post(
        "https://api.line.me/oauth2/v2.1/token",
        qs.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenRes.data.access_token;

      // 2. Request user profile
      const profileRes = await axios.get("https://api.line.me/v2/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profile = profileRes.data;
      console.log(profile); // View user data in the console: userId, displayName, pictureUrl, statusMessage

      return "LINE Login Success! Check the console for user data";
    } catch (e: any) {
      console.error(e.response?.data || e);
      set.status = 500;
      return "LINE Login Failed";
    }
  })

  /**
   * Send a LINE message.
   * @param {Object} context - The context for the request.
   * @param {Object} context.body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the response status and text.
   */
  .get("/send-line-message", async ({ body }) => {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "U1d1b4112afebc7b7d256305a9a9d2450",
        messages: [
          {
            type: "text",
            text: "Hello World",
          },
        ],
      }),
    });

    return {
      status: response.status,
      text: await response.text(),
    };
  });

