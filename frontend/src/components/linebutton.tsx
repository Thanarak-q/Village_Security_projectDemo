/**
 * @file This file provides a React component for a LINE Login button.
 *
 * The `LineLoginButton` component renders a hyperlink that initiates the
 * LINE OAuth 2.0 authorization flow. It constructs the necessary URL
 * with the channel ID, redirect URI, and a randomly generated state
 * to ensure a secure authentication process.
 */

import React from 'react';

/**
 * The client ID for the LINE Login channel.
 * @type {string}
 */
const LINE_CHANNEL_ID = '2007847995';

/**
 * The URI to which the user will be redirected after authentication.
 * This URI must be registered with the LINE Login provider.
 * @type {string}
 */
const REDIRECT_URI = encodeURIComponent('http://localhost/api/callback');

/**
 * A randomly generated string used to prevent Cross-Site Request Forgery (CSRF) attacks.
 * @type {string}
 */
const STATE = Math.random().toString(36).substring(2);

/**
 * The complete URL for initiating the LINE Login authorization flow.
 * @type {string}
 */
const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=profile%20openid`;

/**
 * A React component that renders a button for initiating LINE Login.
 *
 * @returns {React.ReactElement} A hyperlink styled as a button that directs the user to the LINE Login page.
 */
export default function LineLoginButton(): React.ReactElement {
  return (
    <a href={lineLoginUrl}>
      Login with LINE
    </a>
  );
}