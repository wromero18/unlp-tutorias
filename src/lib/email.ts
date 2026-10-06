import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}

/**
 * Manda el mail de recuperación de contraseña. Si no hay SMTP configurado
 * (ver .env / README), no falla: solo deja el link en la consola del
 * servidor para poder seguir probando en desarrollo.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!isEmailConfigured()) {
    console.log(
      `[email no configurado] Link para restablecer la contraseña de ${to}: ${resetUrl}`
    );
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Restablecer tu contraseña - UNLP Tutorías",
    text: `Pediste restablecer tu contraseña. Entrá a este link para elegir una nueva (vence en 1 hora):\n\n${resetUrl}\n\nSi no fuiste vos, ignorá este mensaje.`,
    html: `
      <p>Pediste restablecer tu contraseña en UNLP Tutorías.</p>
      <p><a href="${resetUrl}">Hacé clic acá para elegir una nueva contraseña</a> (el link vence en 1 hora).</p>
      <p>Si no fuiste vos, ignorá este mensaje.</p>
    `,
  });
}
