import {Resend} from 'resend'
import dotenv from 'dotenv'

dotenv.config({
    path: './src/.env'
})

export function sendConfirmationEmail(email: string, token: string) {
    const html = `
<h1>Confirm your email</h1>
<p>Click the link below to confirm your email</p>
<a href="http://grod.anonymousplatypus.work/api/auth/confirm-email/${token}">Confirm email</a>
`

    const resend = new Resend(process.env.RESEND_API_KEY!)

    console.log('Email', email)

    return resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Please confirm your email',
        html: html
    })
}

export function sendForgotPasswordEmail(email: string, token: string, callbackUrl: string) {
    const html = `
<h1>Reset Your Password</h1>
<p>Click the link below to reset your password</p>
<a href="${callbackUrl}?token=${token}">reset password</a>
`

    const resend = new Resend(process.env.RESEND_API_KEY!)

    return resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Please Reset your password',
        html: html
    })
}


