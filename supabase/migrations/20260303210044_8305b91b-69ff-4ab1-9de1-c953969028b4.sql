INSERT INTO public.email_templates (slug, name, subject, description, body_html, is_active)
VALUES (
  'password_reset',
  'Redefinição de Senha',
  'Redefina sua senha - IronMines',
  'Enviado quando o admin solicita redefinição de senha para um usuário',
  '<h2 style="color: #E01393; margin-bottom: 16px;">Redefinição de Senha</h2>
<p>Olá <strong>{{name}}</strong>,</p>
<p>Uma redefinição de senha foi solicitada para sua conta IronMines.</p>
<p>Clique no botão abaixo para definir uma nova senha:</p>
<div style="text-align: center; margin: 30px 0;">
  <a href="{{reset_url}}" style="background: #E01393; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Redefinir Senha</a>
</div>
<p style="font-size: 13px; color: #888;">Se você não solicitou essa redefinição, ignore este email.</p>',
  true
)
ON CONFLICT (slug) DO NOTHING;