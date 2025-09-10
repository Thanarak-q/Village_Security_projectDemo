import React from 'react';

const LINE_CHANNEL_ID = '2007847995';
const REDIRECT_URI = encodeURIComponent('http://167.71.218.163/api/callback');
const STATE = Math.random().toString(36).substring(2);

const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=profile%20openid`;

export default function LineLoginButton() {
  return (
    <a href={lineLoginUrl}>asdfasdfasdf
    </a>
  );
}