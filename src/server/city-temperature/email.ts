import {Resend} from 'resend'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendAccountEmail({
  to,
  subject,
  intro,
  action,
  url,
}: {
  to: string
  subject: string
  intro: string
  action: string
  url: string
}) {
  const runtimeEnv = {...import.meta.env, ...process.env}
  const apiKey = runtimeEnv.RESEND_API_KEY
  const from = runtimeEnv.AUTH_EMAIL_FROM
  if (!apiKey || !from) throw new Error('Account email is not configured.')

  const resend = new Resend(apiKey)
  const safeUrl = escapeHtml(url)
  const {error} = await resend.emails.send({
    from,
    to,
    subject,
    text: `${intro}\n\n${action}: ${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#102a43"><h1 style="font-size:22px">City Temperature Game</h1><p>${escapeHtml(intro)}</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:white;text-decoration:none;font-weight:700">${escapeHtml(action)}</a></p><p style="color:#627d98;font-size:13px">If you did not request this, you can ignore this email.</p></div>`,
  })
  if (error) throw new Error(error.message)
}
