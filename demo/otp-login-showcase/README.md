# OTP Login Showcase

Open this page from the running service:

`http://127.0.0.1:4010/demo/otp-login-showcase/`

What it demonstrates:

- collect email from a user
- call `/api/v1/otp/send`
- collect OTP from email
- call `/api/v1/otp/verify`
- store returned session tokens in browser memory
- call `/api/v1/identities/me`
- refresh and logout the session

Important:

- this is a local showcase frontend for understanding the integration flow
- it includes app credentials in the browser for demo purposes only
- in a real product, app secrets should stay on your backend
